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
} from "@/types/ai";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum tool calls per turn. Prevents infinite agentic loops. */
const MAX_TOOL_CALLS_PER_TURN = 5;

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

// ── Tool message wire type (OpenRouter extension, not in public IMessage) ──────

interface ToolResultMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
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
 *   4. Call OpenRouter via the centralised client
 *   5. Execute tool calls (capped at MAX_TOOL_CALLS_PER_TURN)
 *   6. Re-prompt the model with tool results
 *   7. Persist and return the final assistant message
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
  buildSystemPrompt(params.pageContext),
  getConversationHistory(conversationId, 20),
]);

  // The history contains the user message we just saved. Remove it —
  // we add it explicitly so it is always the final message in the array.
  const priorHistory = history.slice(0, -1);

  const messages: OpenRouterMessage[] = [
    { role: MESSAGE_ROLES.SYSTEM, content: systemPrompt },
    ...formatHistoryForPrompt(priorHistory),
    { role: MESSAGE_ROLES.USER, content: sanitizedMessage },
  ];

  // Bail before the first (most expensive) provider call if the client is
  // already gone — e.g. it disconnected while we were doing the DB work
  // above. Throws the signal's abort reason, which the route treats as an
  // expected cancellation rather than a real error.
  params.signal?.throwIfAborted();

  // 4. First completion — streams real text deltas straight to the client
  // as they arrive from Gemini. In practice a tool-calling turn produces
  // no text alongside the function call, so this is safe even though the
  // outcome (tool call vs. direct answer) isn't known until the stream
  // finishes.
  const { response: firstResponse, latencyMs: firstLatency } = await createCompletion(
    {
      model,
      messages,
      tools: AI_TOOL_DEFINITIONS,
      temperature: 0.4,
      maxTokens: 4096,
      signal: params.signal,
    },
    onEvent ? (delta) => onEvent({ type: "chunk", delta }) : undefined
  );

  const firstChoice = firstResponse.choices[0];
  // client.ts already validates choices.length > 0, so this is a
  // belt-and-suspenders guard against a race at the type boundary.
  if (!firstChoice) {
    throw new Error("OpenRouter returned no choices — this should have been caught in client.ts");
  }

  const toolCallsData: IToolCall[] = [];
  let finalContent: string;
  let finalLatencyMs = firstLatency;
  let finalUsage: ITokenUsage | undefined;

  // 5+6. Tool execution + second completion
  if (
    firstChoice.finish_reason === "tool_calls" &&
    firstChoice.message.tool_calls?.length
  ) {
    // Don't kick off tool calls (each of which may hit external APIs) for
    // a client that's already disconnected.
    params.signal?.throwIfAborted();

    // Cap the number of tool calls to prevent runaway cost in edge cases
    // where the model requests more tools than intended.
    const requestedCalls = firstChoice.message.tool_calls.slice(0, MAX_TOOL_CALLS_PER_TURN);

    if (firstChoice.message.tool_calls.length > MAX_TOOL_CALLS_PER_TURN) {
      logger.warn("Model requested more tool calls than allowed; truncating", {
        requested: firstChoice.message.tool_calls.length,
        allowed: MAX_TOOL_CALLS_PER_TURN,
      });
    }

    if (onEvent) {
      onEvent({ type: "tool_status", label: buildToolStatusLabel(requestedCalls.map((tc) => tc.function.name)) });
    }

    // Build the thread: original messages + assistant's tool-call turn
    // Using a wider type here because "tool" role is an OpenRouter
    // extension not included in our public OpenRouterMessage union.
    const extendedMessages: Array<OpenRouterMessage | ToolResultMessage> = [
      ...messages,
      {
        role: MESSAGE_ROLES.ASSISTANT,
        content: firstChoice.message.content ?? "",
      },
    ];

    // Execute all tool calls in parallel, collecting results.
    // Promise.allSettled ensures one failed tool doesn't block the others.
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

        let result: unknown;
        try {
          result = await executeTool(toolName, parsedArgs);
        } catch (toolError) {
          logger.error("Tool execution error", { tool: toolName, error: String(toolError) });
          // Return a structured error the model can reason about rather
          // than letting the entire request fail.
          result = { error: "Tool execution failed. No data available for this query." };
        }

        toolCallsData.push({ name: toolName, arguments: parsedArgs, result });

        return { id: tc.id, name: toolName, result };
      })
    );

    // Append each tool result message to the thread.
    // Fulfilled and rejected results are both handled — a rejected
    // Promise.allSettled result means our own error handler above
    // threw, which should not normally happen given the try/catch.
    for (const s of settled) {
      if (s.status === "fulfilled") {
        const { id, name, result } = s.value;
        const toolResultMsg: ToolResultMessage = {
          role: "tool",
          tool_call_id: id,
          name,
          // Tool content must be a string per OpenRouter spec
          content: JSON.stringify(result),
        };
        extendedMessages.push(toolResultMsg);
      } else {
        logger.error("Unexpected tool settlement failure", { reason: String(s.reason) });
      }
    }

    // Tool calls may have taken a while (external APIs) — don't fire off
    // the second, also-billed completion if the client left in the
    // meantime.
    params.signal?.throwIfAborted();

    // Second completion — model reasons over the tool results and
    // streams its final answer live. Tools are declared but explicitly
    // disallowed (toolChoice: "none") rather than omitted — see
    // NO_FUNCTION_CALLING in client.ts for why: dropping the schema
    // abruptly on this pass is what lets some Gemini 3.x models still
    // attempt (and fail) a function call out of habit from the prior
    // turn, surfacing as finish_reason "malformed_function_call" with
    // no usable text.
    const secondCallOptions = {
      model,
      messages: extendedMessages as OpenRouterMessage[],
      tools: AI_TOOL_DEFINITIONS,
      toolChoice: "none" as const,
      temperature: 0.4,
      maxTokens: 4096,
      signal: params.signal,
    };

    const { response: secondResponse, latencyMs: secondLatency } = await createCompletion(
      secondCallOptions,
      onEvent ? (delta) => onEvent({ type: "chunk", delta }) : undefined
    );

    let secondChoice = secondResponse.choices[0];
    finalLatencyMs = firstLatency + secondLatency;
    let usageSource = secondResponse.usage;

    const hasUsableText = Boolean(secondChoice?.message.content?.trim());
    if (!hasUsableText && secondChoice?.finish_reason !== "stop") {
      // The fix above resolves this in the vast majority of cases, but
      // treat it as a transient model hiccup rather than a hard failure —
      // one retry, same shape, before falling back.
      logger.warn("Second completion produced no usable text — retrying once", {
        finishReason: secondChoice?.finish_reason,
      });

      params.signal?.throwIfAborted();

      const retry = await createCompletion(
        secondCallOptions,
        onEvent ? (delta) => onEvent({ type: "chunk", delta }) : undefined
      );

      secondChoice = retry.response.choices[0];
      finalLatencyMs += retry.latencyMs;
      usageSource = retry.response.usage ?? usageSource;
    }

    const modelText = secondChoice?.message.content?.trim();
    if (modelText) {
      finalContent = modelText;
    } else {
      // Even the retry came back without usable text. Fall back to a
      // message built from the tool results themselves — most
      // importantly a successful submit_quote_request's real reference
      // number — rather than a generic apology, so anything already
      // accomplished this turn isn't lost to the user just because the
      // closing prose failed. This wasn't streamed live like the model's
      // own text would have been, so relay it the same way the canned
      // short-circuit responses below do.
      finalContent = buildFallbackContent(toolCallsData);
      if (onEvent) {
        await streamContentToClient(finalContent, onEvent, params.signal);
      }
    }

    if (usageSource) {
      finalUsage = mapUsage(usageSource);
    }
  } else {
    finalContent = firstChoice.message.content?.trim() || FALLBACK_RESPONSE;

    if (firstResponse.usage) {
      finalUsage = mapUsage(firstResponse.usage);
    }
  }

  // 7. Persist the assistant message with telemetry
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
  const quoteCall = [...toolCalls]
    .reverse()
    .find((tc) => tc.name === AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST && isSuccessfulQuoteResult(tc.result));

  if (quoteCall && isSuccessfulQuoteResult(quoteCall.result)) {
    return quoteCall.result.message;
  }

  return FALLBACK_RESPONSE;
}

function isSuccessfulQuoteResult(
  value: unknown
): value is { success: true; message: string; quoteNumber?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { success?: unknown }).success === true &&
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