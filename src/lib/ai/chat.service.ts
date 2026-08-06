import "server-only";
import { createCompletion } from "./client";
import { buildSystemPrompt } from "./prompts/system";
import { AI_TOOL_DEFINITIONS, TOOL_STATUS_LABELS } from "./tools/definitions";
import { executeTool } from "./tools/executor";
import {
  findOrCreateConversation,
  getConversationHistory,
  saveUserMessage,
  saveAssistantMessage,
  formatHistoryForPrompt,
} from "./conversation";
import { MESSAGE_ROLES, AI_MODELS, AI_TOOL_NAMES } from "@/database/constants/ai";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { logger } from "@/lib/logging/logger";
import { sanitizePlainText } from "@/utils/validators";
import type { AiModel, AiToolName } from "@/database/constants/ai";
import type {
  IMessage,
  ITokenUsage,
  IToolCall,
  ChatResponse,
  ChatStreamEvent,
  OpenRouterMessage,
  OpenRouterToolCall,
} from "@/types/ai";

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Hard cap on total individual tool *executions* in a single turn — a
 * deduped repeat (see MAX_TOOL_ROUNDS below and the dedup cache in the
 * loop) doesn't count against this, only genuinely new name+argument
 * combinations do. Prevents runaway cost if the model asks for many
 * distinct lookups in one turn.
 */
const MAX_TOOL_CALLS_PER_TURN = 5;

/**
 * Hard cap on model↔tool round-trips in a single turn, independent of
 * MAX_TOOL_CALLS_PER_TURN. Some models (observed with gemini-3.5-flash-lite)
 * reliably want to make sequential single-tool-call rounds for an ordinary
 * multi-part request (e.g. look up the departure airport, then the
 * destination, then search aircraft) — that's legitimate and the loop
 * below supports it, but this bounds total latency/cost even in a
 * pathological case where a model keeps finding "just one more" reason
 * to call something every round without ever reaching MAX_TOOL_CALLS_PER_TURN
 * (e.g. because most of those rounds turn out to be deduped repeats).
 */
const MAX_TOOL_ROUNDS = 4;

/**
 * Info-gathering tools that establish trip details. If the model requests
 * submit_quote_request in the SAME round as any of these, that's a strong
 * signal the required "summarise and ask the customer to confirm" step
 * (see buildSystemPrompt's Quotation Workflow, step 6) was skipped — a
 * model can describe a confirmation step in a reply and then submit the
 * same turn regardless of whether the customer actually replied yes, so
 * this can't be enforced by prompt wording alone. See the guard in the
 * tool round loop below.
 */
const INFO_GATHERING_TOOL_NAMES: AiToolName[] = [
  AI_TOOL_NAMES.SEARCH_AIRCRAFT,
  AI_TOOL_NAMES.LOOKUP_AIRPORT,
  AI_TOOL_NAMES.FIND_NEARBY_AIRPORTS,
];

/** Fallback content when the model returns an empty response. */
const FALLBACK_RESPONSE =
  "I'm sorry, I wasn't able to generate a response. Please try again.";

/** Pace of the outbound chunk stream for the canned, non-model short
 *  circuits below — tuned for a premium, unhurried reveal rather than an
 *  instant dump or a sluggish crawl. */
const STREAM_WORD_GROUP_SIZE = 3;
const STREAM_CHUNK_DELAY_MS = 20;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RunChatParams {
  userMessage: string;
  conversationId?: string;
  sessionId: string;
  clerkUserId?: string;
  model?: AiModel;
  /** Short, client-derived description of the page the visitor is on. */
  pageContext?: string;
  /**
   * Aborted by the caller when the client disconnects mid-stream. Threaded
   * into every `createCompletion` call so the in-flight provider request is
   * torn down immediately instead of running (and being paid for) to
   * completion for a response nobody will read. Also checked between steps
   * below so we skip tool execution / the second completion entirely once
   * aborted, rather than only cutting off the current network call.
   */
  signal?: AbortSignal;
}

// ── Tool message wire types (OpenRouter extensions, not in public IMessage) ────

interface ToolResultMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}

// The turn where the model requested tool calls. Carries the real
// tool_calls array (including each call's thoughtSignature, where the
// model returned one) through to client.ts's toGeminiContents, instead
// of the plain-text-only shape used elsewhere — see OpenRouterToolCall
// for why the signature matters.
interface AssistantToolCallMessage {
  role: "assistant";
  content: string;
  tool_calls?: OpenRouterToolCall[];
}

// ── Orchestration ─────────────────────────────────────────────────────────────

/**
 * Core chat orchestration. This is the only public entry point for AI
 * chat — the API route calls this; nothing else should.
 *
 * Flow:
 *   1. Resolve or create conversation
 *   2. Persist the user message
 *   3. Build the full prompt (system + history + user turn)
 *   4. Loop: call the model, execute any requested tools, feed results
 *      back, repeat — until the model stops requesting tools or the
 *      round/call caps are hit (see MAX_TOOL_ROUNDS, MAX_TOOL_CALLS_PER_TURN)
 *   5. Persist and return the final assistant message
 */
export async function runChat(
  params: RunChatParams,
  onEvent?: (event: ChatStreamEvent) => void
): Promise<ChatResponse> {
  const model = params.model ?? AI_MODELS.DEFAULT;

  // Sanitize user input before any persistence or prompt injection
  const sanitizedMessage = sanitizePlainText(params.userMessage);
  if (!sanitizedMessage) {
    throw new Error("Message cannot be empty after sanitization");
  }

  // 1. Resolve conversation
  const conversation = await findOrCreateConversation({
    conversationId: params.conversationId,
    sessionId: params.sessionId,
    clerkUserId: params.clerkUserId,
    aiModel: model,
  });

  const conversationId = String(conversation._id);

  // Fetched once per turn and reused everywhere below (buildSystemPrompt,
  // the enabled check, the conversation-length check) — never re-fetched.
  const settings = await getSiteSettings();

  if (!settings.ai.enabled) {
    return respondWithoutCallingModel(
      conversationId,
      params.sessionId,
      "The AI Concierge is temporarily unavailable. Please contact our operations team directly and they'll be glad to help.",
      onEvent,
      params.signal
    );
  }

  if (conversation.messageCount >= settings.ai.maxConversationLength) {
    return respondWithoutCallingModel(
      conversationId,
      params.sessionId,
      "We've covered a lot in this conversation — to keep things running smoothly, please start a new conversation, or reach out to our operations team directly for anything further.",
      onEvent,
      params.signal
    );
  }

  // 2. Persist user message
  await saveUserMessage(conversationId, sanitizedMessage);

  // 3. Build prompt — system prompt and history fetched in parallel
  const [systemPrompt, history] = await Promise.all([
    buildSystemPrompt(params.pageContext, settings),
    getConversationHistory(conversationId, 20),
  ]);

  // The history contains the user message we just saved. Remove it —
  // we add it explicitly so it is always the final message in the array.
  const priorHistory = history.slice(0, -1);

  // Running thread for the whole turn — extended in place as tool-calling
  // rounds happen below. Using a wider type here because "tool" role is
  // an OpenRouter extension not included in our public OpenRouterMessage
  // union, and the tool-call turn itself needs to carry the real
  // tool_calls array (see AssistantToolCallMessage).
  const thread: Array<OpenRouterMessage | AssistantToolCallMessage | ToolResultMessage> = [
    { role: MESSAGE_ROLES.SYSTEM, content: systemPrompt },
    ...formatHistoryForPrompt(priorHistory),
    { role: MESSAGE_ROLES.USER, content: sanitizedMessage },
  ];

  // Bail before the first (most expensive) provider call if the client is
  // already gone — e.g. it disconnected while we were doing the DB work
  // above. Throws the signal's abort reason, which the route treats as an
  // expected cancellation rather than a real error.
  params.signal?.throwIfAborted();

  // 4. Model ↔ tool loop. Some models (observed with gemini-3.5-flash-lite)
  // reliably want a second, third, etc. tool call for an ordinary
  // multi-part request — e.g. look up the departure airport, then the
  // destination, then search aircraft — rather than asking for everything
  // in one round. This loop keeps going until the model produces a real
  // answer or a cap is hit, executing each round's tool calls and feeding
  // the results back before asking again.
  const toolCallsData: IToolCall[] = [];
  // Dedup cache, keyed by buildToolIdentityKey (see below) — a per-tool
  // semantic identity (e.g. lookup_airport's `code`, search_aircraft's
  // filter fields), not raw argument-string equality. Seeded from the
  // conversation's own prior tool calls, not just this turn: the
  // redundancy this catches shows up across turns too — e.g. the
  // confirmation-ask turn (workflow step 6) re-calling
  // lookup_airport/search_aircraft for a route already established two
  // messages ago, which both wastes a call and re-renders the same
  // aircraft/airport cards the customer already saw. A deduped call is
  // answered from the earlier result and — critically — NOT pushed into
  // toolCallsData again (see the `if (!deduped)` guard below), so the
  // card doesn't reappear either.
  const executedCalls = new Map<string, unknown>(buildHistoricalToolCallCache(priorHistory));
  let finalContent = "";
  let finalLatencyMs = 0;
  let finalUsage: ITokenUsage | undefined;

  for (let round = 1; ; round++) {
    params.signal?.throwIfAborted();

    // Tools are only offered while both caps still allow another real
    // round of calling. Once either is exhausted, this round is
    // structurally final — the model has nothing left to call, so
    // whatever it says (or fails to say) here is treated as the answer,
    // even if it still tries to request a tool anyway (observed to
    // happen occasionally even with no tools declared — see the
    // `finish_reason === "tool_calls"` guard below, which is ANDed with
    // `toolsOffered` specifically to ignore that case rather than act on
    // a call that was never actually offered).
    const toolsOffered = round <= MAX_TOOL_ROUNDS && toolCallsData.length < MAX_TOOL_CALLS_PER_TURN;

    const roundOptions = {
      model,
      messages: thread as OpenRouterMessage[],
      ...(toolsOffered ? { tools: AI_TOOL_DEFINITIONS } : {}),
      temperature: 0.4,
      maxTokens: 4096,
      signal: params.signal,
    };

    // Streams real text deltas straight to the client as they arrive. In
    // practice a tool-calling round produces no text alongside the
    // function call, so this is safe even though the outcome (another
    // tool call vs. a direct answer) isn't known until the stream ends.
    const { response, latencyMs } = await createCompletion(
      roundOptions,
      onEvent ? (delta) => onEvent({ type: "chunk", delta }) : undefined
    );
    finalLatencyMs += latencyMs;
    if (response.usage) {
      finalUsage = mapUsage(response.usage);
    }

    const choice = response.choices[0];
    // client.ts already validates choices.length > 0, so this is a
    // belt-and-suspenders guard against a race at the type boundary.
    if (!choice) {
      throw new Error("OpenRouter returned no choices — this should have been caught in client.ts");
    }

    const wantsTools = toolsOffered && choice.finish_reason === "tool_calls" && Boolean(choice.message.tool_calls?.length);

    if (wantsTools) {
      // Don't kick off tool calls (each of which may hit external APIs)
      // for a client that's already disconnected.
      params.signal?.throwIfAborted();

      // Cap to the remaining budget for this turn. Slicing here — before
      // the assistant turn below is built — keeps the reconstructed
      // functionCall parts limited to exactly the calls we're about to
      // answer with a functionResponse; including calls we won't answer
      // would leave a dangling functionCall part with nothing responding
      // to it, which Gemini rejects.
      const remainingBudget = MAX_TOOL_CALLS_PER_TURN - toolCallsData.length;
      const requestedCalls = choice.message.tool_calls!.slice(0, remainingBudget);

      if (choice.message.tool_calls!.length > requestedCalls.length) {
        logger.warn("Model requested more tool calls than the remaining turn budget; truncating", {
          requested: choice.message.tool_calls!.length,
          remainingBudget,
        });
      }

      // Guard: never let submit_quote_request execute in the same round
      // as a fresh aircraft/airport lookup (see INFO_GATHERING_TOOL_NAMES
      // above). That combination means the customer-confirmation step was
      // skipped — the model went straight from gathering info to
      // submitting without a turn in between where the customer actually
      // said yes. Rather than trust the prompt alone to prevent this, the
      // submit call is intercepted here and answered with an explanatory
      // result instead of being executed, which forces at least one more
      // round where the model must ask for confirmation in plain text.
      const isGatheringInfoThisRound = requestedCalls.some((tc) =>
        INFO_GATHERING_TOOL_NAMES.includes(tc.function.name as AiToolName)
      );

      if (onEvent) {
        onEvent({ type: "tool_status", label: buildToolStatusLabel(requestedCalls.map((tc) => tc.function.name)) });
      }

      // Record the model's real tool-call turn (including any
      // thoughtSignature) so client.ts can reconstruct it as genuine
      // functionCall parts next round — see AssistantToolCallMessage.
      thread.push({
        role: MESSAGE_ROLES.ASSISTANT,
        content: choice.message.content ?? "",
        tool_calls: requestedCalls,
      });

      // Execute all (non-duplicate) tool calls in parallel, collecting
      // results. Promise.allSettled ensures one failed tool doesn't
      // block the others.
      const settled = await Promise.allSettled(
        requestedCalls.map(async (tc) => {
          const toolName = tc.function.name as AiToolName;

          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            logger.warn("Failed to parse tool arguments — using empty args", {
              tool: toolName,
              raw: tc.function.arguments,
            });
          }

          // Blocked: this exact tool call is a submit_quote_request that
          // arrived bundled with fresh info-gathering calls this same
          // round — see the guard comment above. Answer it with an
          // explanatory pseudo-result (every requested functionCall part
          // needs a matching functionResponse) instead of ever reaching
          // executeTool, so nothing is actually submitted.
          if (toolName === AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST && isGatheringInfoThisRound) {
            logger.warn("Blocked submit_quote_request: bundled with info-gathering tools in the same round — confirmation step was skipped", {
              toolsThisRound: requestedCalls.map((c) => c.function.name),
            });
            const blockedResult = {
              success: false,
              message:
                "Not submitted. Before calling submit_quote_request, you must first send the customer a short summary of the trip and explicitly ask them to confirm, in a message with no tool calls. Only call submit_quote_request again after the customer's own next message confirms.",
            };
            return { id: tc.id, name: toolName, parsedArgs, result: blockedResult, deduped: false };
          }

          const dedupeKey = `${toolName}::${buildToolIdentityKey(toolName, parsedArgs)}`;
          if (executedCalls.has(dedupeKey)) {
            logger.debug("Skipped duplicate tool call this turn — reusing cached result", { tool: toolName });
            return { id: tc.id, name: toolName, parsedArgs, result: executedCalls.get(dedupeKey), deduped: true };
          }

          let result: unknown;
          try {
            result = await executeTool(toolName, parsedArgs);
          } catch (toolError) {
            logger.error("Tool execution error", { tool: toolName, error: String(toolError) });
            // Return a structured error the model can reason about rather
            // than letting the entire request fail.
            result = { error: "Tool execution failed. No data available for this query." };
          }
          executedCalls.set(dedupeKey, result);

          return { id: tc.id, name: toolName, parsedArgs, result, deduped: false };
        })
      );

      // Append each tool result message to the thread. Fulfilled and
      // rejected results are both handled — a rejected Promise.allSettled
      // result means our own error handler above threw, which should not
      // normally happen given the try/catch.
      for (const s of settled) {
        if (s.status === "fulfilled") {
          const { id, name, parsedArgs, result, deduped } = s.value;
          thread.push({
            role: "tool",
            tool_call_id: id,
            name,
            // Tool content must be a string per OpenRouter spec.
            content: JSON.stringify(result),
          });
          // A deduped call already has an entry in toolCallsData from
          // when it was first (really) executed — don't log it again.
          if (!deduped) {
            toolCallsData.push({ name, arguments: parsedArgs, result });
          }
        } else {
          logger.error("Unexpected tool settlement failure", { reason: String(s.reason) });
        }
      }

      // Tool calls may have taken a while (external APIs) — don't fire
      // off another, also-billed completion if the client left in the
      // meantime.
      params.signal?.throwIfAborted();

      continue;
    }

    // The model isn't asking for another tool call (or wasn't offered
    // one this round) — this is meant to be the final answer.
    const hasUsableText = Boolean(choice.message.content?.trim());

    if (!hasUsableText && choice.finish_reason !== "stop") {
      // Not a legitimate "wants more tools" case (handled above) and not
      // a clean stop either — a genuine hiccup (e.g. a malformed
      // function-call attempt that survived the toolsOffered guard).
      // Retry this same round once before falling back.
      logger.warn("Completion produced no usable text — retrying once", {
        round,
        finishReason: choice.finish_reason,
      });

      params.signal?.throwIfAborted();

      const retry = await createCompletion(
        roundOptions,
        onEvent ? (delta) => onEvent({ type: "chunk", delta }) : undefined
      );
      finalLatencyMs += retry.latencyMs;
      if (retry.response.usage) {
        finalUsage = mapUsage(retry.response.usage);
      }

      const retryText = retry.response.choices[0]?.message.content?.trim();
      if (retryText) {
        finalContent = retryText;
        break;
      }
      // Even the retry came back without usable text. Fall back to a
      // message built from the tool results gathered so far — most
      // importantly a successful submit_quote_request's real reference
      // number, or a confirmed-empty search — rather than a generic
      // apology, so anything already accomplished this turn isn't lost
      // just because the closing prose failed. This wasn't streamed live
      // like the model's own text would have been, so relay it the same
      // way the canned short-circuit responses below do.
      finalContent = buildFallbackContent(toolCallsData);
      if (onEvent) {
        await streamContentToClient(finalContent, onEvent, params.signal);
      }
      break;
    }

    finalContent = hasUsableText ? choice.message.content!.trim() : buildFallbackContent(toolCallsData);
    if (!hasUsableText && onEvent) {
      await streamContentToClient(finalContent, onEvent, params.signal);
    }
    break;
  }

  // 5. Persist the assistant message with telemetry
  // Persisted even for an aborted client (the signal only stops the
  // provider calls above, not everything downstream) — the conversation
  // history should stay accurate for when the user comes back, and this
  // write is cheap regardless of who's listening.
  const assistantMessage = await saveAssistantMessage(conversationId, finalContent, {
    toolCalls: toolCallsData,
    tokenUsage: finalUsage,
    latencyMs: finalLatencyMs,
  });

  const messageOut: IMessage = {
    _id: String(assistantMessage._id),
    conversationId,
    role: "assistant",
    content: finalContent,
    toolCalls: toolCallsData,
    tokenUsage: finalUsage,
    latencyMs: finalLatencyMs,
    createdAt: new Date(assistantMessage.createdAt).toISOString(),
    updatedAt: new Date(assistantMessage.updatedAt).toISOString(),
  };

  // Content was already streamed live via onChunk during the completion
  // call(s) above — just signal completion now.
  if (onEvent) {
    onEvent({
      type: "done",
      conversationId,
      sessionId: params.sessionId,
      message: messageOut,
      tokenUsage: finalUsage,
    });
  }

  return {
    conversationId,
    sessionId: params.sessionId,
    message: messageOut,
    tokenUsage: finalUsage,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a dedupe-cache seed from the conversation's prior assistant
 * turns, keyed the same way as the live per-turn dedupe cache in
 * runChat's tool loop (`${toolName}::${argumentsJSON}`). See the seeding
 * call site for why this exists and its matching caveat.
 */
function buildHistoricalToolCallCache(
  history: Array<{ role: string; toolCalls?: IToolCall[] }>
): Map<string, unknown> {
  const cache = new Map<string, unknown>();
  for (const msg of history) {
    if (msg.role !== MESSAGE_ROLES.ASSISTANT || !msg.toolCalls?.length) continue;
    for (const tc of msg.toolCalls) {
      const key = `${tc.name}::${buildToolIdentityKey(tc.name as AiToolName, tc.arguments)}`;
      // Keep the earliest result for a given key — a later, presumably
      // identical repeat isn't more authoritative than the first.
      if (!cache.has(key)) cache.set(key, tc.result);
    }
  }
  return cache;
}

/**
 * Computes a stable identity key for a tool call from its PARSED
 * arguments, used for both the live per-turn dedupe and the
 * history-seeded cache above — sharing one function is what makes the
 * two key spaces actually comparable (a previous version computed the
 * live key from the raw, unparsed arguments string and the seeded key
 * from a re-serialized one, which rarely matched even for identical
 * calls).
 *
 * Per-tool identity fields, rather than the full argument object, so an
 * incidental extra/omitted field (e.g. missionType present on a later
 * search_aircraft call but absent on an earlier one) doesn't defeat
 * deduping when the fields that actually determine "is this the same
 * real-world lookup" are unchanged. Field lists are taken directly from
 * AI_TOOL_DEFINITIONS' parameter schemas.
 */
function buildToolIdentityKey(toolName: AiToolName, args: Record<string, unknown>): string {
  // undefined/null and an omitted key should produce the same identity,
  // so a field that's explicitly undefined on one call and absent on
  // another still dedupes correctly.
  const has = (key: string): boolean => args[key] !== undefined && args[key] !== null;
  const norm = (key: string): unknown => {
    const v = args[key];
    return typeof v === "string" ? v.trim().toLowerCase() : v;
  };

  switch (toolName) {
    case AI_TOOL_NAMES.LOOKUP_AIRPORT: {
      // code is the authoritative identity when present (ICAO/IATA is
      // unambiguous); only fall back to the free-text query when no
      // code was given.
      if (has("code")) return `code:${String(norm("code")).toUpperCase()}`;
      return `query:${has("query") ? norm("query") : ""}`;
    }
    case AI_TOOL_NAMES.FIND_NEARBY_AIRPORTS: {
      return `ref:${has("referenceCode") ? String(norm("referenceCode")).toUpperCase() : ""}`;
    }
    case AI_TOOL_NAMES.SEARCH_AIRCRAFT: {
      const fields = [
        "passengerCount",
        "missionType",
        "category",
        "minRangeNm",
        "petFriendly",
        "wifiAvailable",
        "shortRunwayCapable",
        "region",
      ];
      return JSON.stringify(fields.map((f) => (has(f) ? norm(f) : null)));
    }
    case AI_TOOL_NAMES.SEARCH_KNOWLEDGE: {
      return `q:${has("query") ? norm("query") : ""}|c:${has("category") ? norm("category") : ""}`;
    }
    case AI_TOOL_NAMES.GET_COMPANY_INFO: {
      // No parameters — every call is identical by definition.
      return "static";
    }
    default: {
      // submit_quote_request is intentionally never deduped (each
      // submission should genuinely execute, and it's excluded from
      // INFO_GATHERING_TOOL_NAMES so it never reaches this path via the
      // normal flow anyway) — and any future tool not special-cased above
      // falls back to a fully sorted, nullish-stripped JSON of its args
      // rather than raw insertion order.
      const sorted = Object.keys(args)
        .filter((k) => has(k))
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = norm(k);
          return acc;
        }, {});
      return JSON.stringify(sorted);
    }
  }
}

/**
 * Persists a single assistant message and returns it as a normal
 * ChatResponse, without calling the model at all — used for the
 * disabled/conversation-length-exceeded short circuits above, so those
 * cases cost nothing beyond a single write.
 */
async function respondWithoutCallingModel(
  conversationId: string,
  sessionId: string,
  content: string,
  onEvent?: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<ChatResponse> {
  const assistantMessage = await saveAssistantMessage(conversationId, content, {});

  const messageOut: IMessage = {
    _id: String(assistantMessage._id),
    conversationId,
    role: "assistant",
    content,
    toolCalls: [],
    createdAt: new Date(assistantMessage.createdAt).toISOString(),
    updatedAt: new Date(assistantMessage.updatedAt).toISOString(),
  };

  if (onEvent) {
    await streamContentToClient(content, onEvent, signal);
    onEvent({ type: "done", conversationId, sessionId, message: messageOut });
  }

  return { conversationId, sessionId, message: messageOut };
}

/**
 * Builds a fallback reply for when the model fails to produce any
 * usable closing text (e.g. a "malformed_function_call" finish reason
 * that survives the retry above). Prefers relaying a successful
 * submit_quote_request's own confirmation message — which already
 * contains the real, database-generated quote reference — over the
 * generic FALLBACK_RESPONSE, since a quote may well have already been
 * created even though the model failed to write a reply about it.
 */
function buildFallbackContent(toolCalls: IToolCall[]): string {
  const quoteCall = [...toolCalls].reverse().find((tc) => tc.name === AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST && isQuoteResult(tc.result));

  if (quoteCall && isQuoteResult(quoteCall.result)) {
    // Relay the quote service's own message either way: on success it
    // already contains the real, database-generated reference number;
    // on failure it already explains what needs fixing (see
    // submitQuoteRequestForAI) — better than losing that detail to a
    // generic apology just because the model's closing prose failed.
    return quoteCall.result.message;
  }

  // No quote to relay, but other tools may still have returned real,
  // useful data this turn (aircraft, airports, knowledge, company info)
  // that the UI renders as result cards independently of this text. A
  // generic apology reads as if nothing worked when something clearly
  // did — a shorter, honest line fits better here.
  const otherCalls = toolCalls.filter((tc) => tc.name !== AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST);
  if (otherCalls.some((tc) => hasMeaningfulResult(tc.result))) {
    return "Here's what I found — take a look below. Let me know if you'd like more detail or the next step.";
  }

  // Nothing came back with content, but a search may still have run
  // successfully and simply confirmed there's no match — that's real,
  // correct information (see EmptyResultCard, which renders independently
  // of this text from the same empty result), not a failure. Naming it
  // specifically reads far better than a generic "I wasn't able to
  // generate a response" sitting right above a card that clearly did.
  const isEmptyAirportSearch = otherCalls.some(
    (tc) =>
      (tc.name === AI_TOOL_NAMES.LOOKUP_AIRPORT || tc.name === AI_TOOL_NAMES.FIND_NEARBY_AIRPORTS) &&
      isEmptySearchResult(tc.result)
  );
  if (isEmptyAirportSearch) {
    return "That airport isn't one we currently operate to. Take a look at the options below, or contact our operations team and they can confirm availability directly.";
  }

  const isEmptyAircraftSearch = otherCalls.some(
    (tc) => tc.name === AI_TOOL_NAMES.SEARCH_AIRCRAFT && isEmptySearchResult(tc.result)
  );
  if (isEmptyAircraftSearch) {
    return "Nothing in the fleet fits those exact requirements. Take a look at the options below, or contact our operations team and they can find the right alternative.";
  }

  return FALLBACK_RESPONSE;
}

/** True for a non-error result with actual content — excludes `{ error }` results and empty arrays (a genuinely empty search). */
function hasMeaningfulResult(value: unknown): boolean {
  if (!value) return false;
  if (isToolErrorResult(value)) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** A search tool that ran successfully and confirmed zero matches — distinct from a tool error, and worth naming specifically (see buildFallbackContent) rather than folding into a generic apology. */
function isEmptySearchResult(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}

function isToolErrorResult(value: unknown): boolean {
  return typeof value === "object" && value !== null && "error" in value;
}

function isQuoteResult(
  value: unknown
): value is { success: boolean; message: string; quoteNumber?: string; fieldErrors?: Record<string, string> } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { success?: unknown }).success === "boolean" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

/** Combines however many distinct tools were requested into one label,
 *  e.g. "Searching aircraft & airports…" — capped at two for readability. */
function buildToolStatusLabel(toolNames: string[]): string {
  const distinct = Array.from(new Set(toolNames));
  const labels = distinct.map((name) => TOOL_STATUS_LABELS[name]?.replace(/…$/, "") ?? "Working");

  if (labels.length === 1) return `${labels[0]}…`;
  return `${labels.slice(0, 2).join(" & ")}…`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Relays a canned, non-model-generated message to the client
 * progressively rather than as one lump payload — used only by
 * respondWithoutCallingModel (AI disabled / conversation length
 * exceeded), where there's no real token stream to relay because the
 * model was never called.
 *
 * No external API calls happen here, so an abort doesn't need to save any
 * money — but there's no point pacing out 20ms-delayed chunks to a client
 * that's already gone, so we still stop early if `signal` fires.
 */
async function streamContentToClient(
  content: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  // Splitting on a captured whitespace group keeps every space/newline
  // as its own array element, so regrouping and joining is lossless.
  const tokens = content.split(/(\s+)/);

  for (let i = 0; i < tokens.length; i += STREAM_WORD_GROUP_SIZE * 2) {
    if (signal?.aborted) return;
    const delta = tokens.slice(i, i + STREAM_WORD_GROUP_SIZE * 2).join("");
    if (!delta) continue;
    onEvent({ type: "chunk", delta });
    await sleep(STREAM_CHUNK_DELAY_MS);
  }
}

function mapUsage(usage: {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}): ITokenUsage {
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}