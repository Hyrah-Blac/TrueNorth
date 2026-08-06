import "server-only";
import { GoogleGenAI, ApiError, FunctionCallingConfigMode, ThinkingLevel } from "@google/genai";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { MESSAGE_ROLES } from "@/database/constants/ai";
import type { Content, FunctionDeclaration, Part, ThinkingConfig } from "@google/genai";
import type {
  OpenRouterMessage,
  OpenRouterResponse,
  OpenRouterChoice,
  OpenRouterToolCall,
  AiToolDefinition,
} from "@/types/ai";

// ── Config ────────────────────────────────────────────────────────────────────

const GEMINI_TIMEOUT_MS = 30_000;

// Production-tuned generation defaults for a deterministic aviation
// concierge: lower temperature and a wide-but-bounded output budget favour
// consistent, tool-driven answers over open-ended creativity. These are
// used whenever a caller doesn't specify its own value.
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_TOP_P = 0.95;
const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

function getConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("AI service is not configured. GEMINI_API_KEY is missing.", 503, true);
  }
  const model = process.env.GEMINI_MODEL?.trim();
  if (!model) {
    throw new AppError("AI service is not configured. GEMINI_MODEL is missing.", 503, true);
  }
  return { apiKey, model };
}

/**
 * Thinking-mode configuration differs by Gemini generation and is NOT
 * interchangeable: Gemini 3.x models use the semantic `thinkingLevel` field
 * and reject `thinkingBudget`-only requests' sibling field with an error if
 * mismatched, while Gemini 2.5 models only understand the older
 * token-based `thinkingBudget` and reject `thinkingLevel` outright. This
 * picks the right field for the resolved model instead of hardcoding one,
 * so a "medium" level of reasoning effort is applied safely either way.
 */
function buildThinkingConfig(model: string): ThinkingConfig {
  const isGemini3 = /gemini-3/i.test(model);
  if (isGemini3) {
    return { thinkingLevel: ThinkingLevel.MEDIUM };
  }
  // Moderate fixed budget on 2.x models approximates "medium" thinking
  // while keeping latency and token usage bounded and responses
  // consistent (a 0 budget on some 2.5 Flash versions unreliably still
  // emits thought tokens, so a small positive budget is safer than off).
  return { thinkingBudget: 512 };
}

// The SDK client is stateless/cheap to reuse across invocations — cache it
// per API key so we don't reconstruct it on every request in a warm
// serverless instance.
let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): GoogleGenAI {
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompletionOptions {
  model: string;
  messages: OpenRouterMessage[];
  tools?: AiToolDefinition[];
  toolChoice?: "auto" | "none";
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface CompletionResult {
  response: OpenRouterResponse;
  latencyMs: number;
}

// Runtime-only shape used by chat.service.ts's second (post tool-call)
// completion request. Not part of the public OpenRouterMessage union, but
// objects with this shape are passed into `messages` at runtime — see
// chat.service.ts's `ToolResultMessage`.
interface WireToolResultMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}

// Mirrors chat.service.ts's `AssistantToolCallMessage` — the turn where
// the model requested tool calls, carrying the real tool_calls array
// (including any thoughtSignature) rather than plain text.
interface WireAssistantToolCallMessage {
  role: "assistant";
  content: string;
  tool_calls?: OpenRouterToolCall[];
}

// ── Request mapping: OpenRouter-shaped messages → Gemini `contents` ───────────

/**
 * Converts the flat OpenRouter-style message array (as built by
 * chat.service.ts) into Gemini's `systemInstruction` + `contents` shape.
 *
 * Notes on fidelity:
 * - The system message becomes `systemInstruction` (Gemini's idiomatic
 *   equivalent), rather than a turn in the conversation.
 * - The turn where the model requested tool calls (an "assistant" message
 *   carrying `tool_calls`, see WireAssistantToolCallMessage) is
 *   reconstructed as real `functionCall` parts — one per call, each
 *   carrying its `thoughtSignature` if the model returned one. Gemini 3.x
 *   thinking models REQUIRE that signature echoed back verbatim on this
 *   turn; omitting it (or, as before, dropping the turn/call entirely and
 *   describing the result as plain text instead) is a documented cause of
 *   spurious "malformed_function_call" failures on the following turn.
 *   See https://ai.google.dev/gemini-api/docs/thought-signatures.
 * - "tool" role messages (the corresponding results, see
 *   WireToolResultMessage) are reconstructed as real `functionResponse`
 *   parts for the same reason, bundling consecutive ones into a single
 *   "user" turn — closer to how Gemini's own multi-functionResponse turns
 *   are shaped than a run of several separate same-role turns.
 * - A plain-text assistant turn with no tool calls and no content
 *   (shouldn't normally occur) gets a minimal placeholder rather than
 *   being dropped — Gemini rejects empty parts outright, and dropping the
 *   turn instead of placeholding it breaks strict user/model alternation.
 */
function toGeminiContents(messages: OpenRouterMessage[]): {
  systemInstruction?: string;
  contents: Content[];
} {
  let systemInstruction: string | undefined;
  const contents: Content[] = [];
  // Tracks whether the previous pushed turn was a tool-result turn, so
  // consecutive tool results get bundled into one "user" turn (multiple
  // parts) instead of a run of several separate same-role turns.
  let lastWasToolResult = false;

  for (const raw of messages) {
    const msg = raw as OpenRouterMessage | WireToolResultMessage | WireAssistantToolCallMessage;

    if (msg.role === MESSAGE_ROLES.SYSTEM) {
      systemInstruction = systemInstruction
        ? `${systemInstruction}\n\n${msg.content}`
        : msg.content;
      continue;
    }

    if (msg.role === "tool") {
      const toolMsg = msg as WireToolResultMessage;

      let responseData: unknown;
      try {
        responseData = JSON.parse(toolMsg.content);
      } catch {
        responseData = { result: toolMsg.content };
      }
      // Gemini requires functionResponse.response to be a JSON object —
      // wrap anything else (a bare string, number, array, or null) so
      // tool results that aren't already object-shaped are still valid.
      const response =
        responseData && typeof responseData === "object" && !Array.isArray(responseData)
          ? (responseData as Record<string, unknown>)
          : { result: responseData };

      const part: Part = { functionResponse: { name: toolMsg.name, response } };

      if (lastWasToolResult && contents.length > 0) {
        contents[contents.length - 1].parts!.push(part);
      } else {
        contents.push({ role: "user", parts: [part] });
      }
      lastWasToolResult = true;
      continue;
    }

    if (msg.role === MESSAGE_ROLES.ASSISTANT) {
      const assistantMsg = msg as WireAssistantToolCallMessage;
      const toolCalls = assistantMsg.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        const parts: Part[] = [];
        if (assistantMsg.content) {
          parts.push({ text: assistantMsg.content });
        }
        for (const tc of toolCalls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            // Leave empty — mirrors executor.ts's own tolerant handling
            // of unparsable tool arguments.
          }
          parts.push({
            functionCall: { name: tc.function.name, args },
            ...(tc.thoughtSignature ? { thoughtSignature: tc.thoughtSignature } : {}),
          });
        }
        contents.push({ role: "model", parts });
        lastWasToolResult = false;
        continue;
      }

      // No tool calls — plain text turn (or, in the rare case of a truly
      // empty one, a minimal placeholder; see doc comment above).
      const text = assistantMsg.content || "One moment — checking on that.";
      contents.push({ role: "model", parts: [{ text }] });
      lastWasToolResult = false;
      continue;
    }

    // "user"
    contents.push({ role: "user", parts: [{ text: msg.content }] });
    lastWasToolResult = false;
  }

  return { systemInstruction, contents };
}

function toFunctionDeclaration(tool: AiToolDefinition): FunctionDeclaration {
  return {
    name: tool.function.name,
    description: tool.function.description,
    // The Gemini SDK accepts a raw JSON-Schema object here, which is
    // exactly the shape AI_TOOL_DEFINITIONS already produces — no
    // conversion needed.
    parametersJsonSchema: tool.function.parameters,
  };
}

// AI_TOOL_DEFINITIONS is a static module-level constant — chat.service.ts
// passes the exact same array reference on every call. Memoize the mapped
// Gemini tool declarations against that reference so we're not rebuilding
// and reallocating the same objects on every single request.
const toolsCache = new WeakMap<
  AiToolDefinition[],
  [{ functionDeclarations: FunctionDeclaration[] }]
>();

function getGeminiTools(
  tools: AiToolDefinition[]
): [{ functionDeclarations: FunctionDeclaration[] }] {
  const cached = toolsCache.get(tools);
  if (cached) return cached;

  const wrapped: [{ functionDeclarations: FunctionDeclaration[] }] = [
    { functionDeclarations: tools.map(toFunctionDeclaration) },
  ];
  toolsCache.set(tools, wrapped);
  return wrapped;
}

// Fixed, reused config object — function-calling mode never varies per
// request, so there's no reason to allocate a fresh object every call.
const AUTO_FUNCTION_CALLING = {
  functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
} as const;

// Used on a follow-up completion where the caller wants the model to
// compose its final answer rather than call anything further (e.g.
// chat.service.ts's post-tool-execution pass). Declaring the tools with
// calling explicitly disallowed — rather than omitting `tools` entirely —
// keeps the schema Gemini has already "seen" in this session consistent
// across turns. Dropping it abruptly is what lets some Gemini 3.x models
// still attempt a function call out of habit from the prior turn, which
// then fails validation (there's nothing to validate against) and comes
// back as finishReason "malformed_function_call" with no usable text.
const NO_FUNCTION_CALLING = {
  functionCallingConfig: { mode: FunctionCallingConfigMode.NONE },
} as const;

// ── Response mapping: Gemini response → OpenRouterResponse shape ──────────────

/**
 * Maps a Gemini finish reason to the OpenRouter-style string chat.service.ts
 * inspects. Gemini does not have a dedicated "the model wants to call a
 * function" finish reason (it typically reports STOP either way), so tool
 * calls are detected directly from the response's function-call parts and
 * take priority over the raw finish reason.
 */
function mapFinishReason(rawFinishReason: string | undefined, hasToolCalls: boolean): string {
  if (hasToolCalls) return "tool_calls";
  switch (rawFinishReason) {
    case "MAX_TOKENS":
      return "length";
    case "STOP":
    case undefined:
      return "stop";
    default:
      return rawFinishReason.toLowerCase();
  }
}

// ── Client ────────────────────────────────────────────────────────────────────

/**
 * The single point of contact between this application and the Gemini API.
 * No other file may call the Gemini SDK directly.
 *
 * Callers (chat.service.ts) speak the same OpenRouter-shaped wire format as
 * before this migration — this function is the adapter boundary that
 * translates to/from Gemini underneath. Everything above this file remains
 * provider-agnostic.
 *
 * Streaming: the request always uses Gemini's streaming endpoint under the
 * hood. If an `onChunk` callback is supplied, each real text delta is
 * forwarded to it the moment it arrives — callers that don't care about
 * live output can simply omit it and use the fully-accumulated result in
 * the returned CompletionResult, exactly as before.
 *
 * Handles:
 * - Timeout via AbortController (30 s default, now covering the whole
 *   stream — a stalled stream mid-way through is just as fatal as a
 *   stalled request)
 * - Network failures
 * - Non-2xx / SDK ApiError responses (re-thrown as AppError)
 * - Malformed / empty responses
 */
export async function createCompletion(
  options: CompletionOptions,
  onChunk?: (delta: string) => void
): Promise<CompletionResult> {
  const { apiKey, model } = getConfig();
  const start = Date.now();
  const ai = getClient(apiKey);

  const { systemInstruction, contents } = toGeminiContents(options.messages);

  const tools =
    options.tools && options.tools.length > 0 ? getGeminiTools(options.tools) : undefined;

  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const maxOutputTokens = options.maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

  logger.debug("Gemini request", {
    model,
    messageCount: options.messages.length,
    hasTools: Boolean(options.tools?.length),
    toolChoice: options.tools?.length ? (options.toolChoice ?? "auto") : undefined,
    temperature,
    maxOutputTokens,
    streaming: Boolean(onChunk),
  });

  // Timeout guard — Vercel serverless functions have a hard wall-clock
  // limit; without this the function hangs until platform timeout which
  // produces a 504 with no useful error message. This now covers the
  // whole stream, not just the initial call — a stalled stream mid-way
  // through is just as fatal as a stalled request.
const controller = new AbortController();

// Forward cancellation from chat.service.ts
if (options.signal) {
  options.signal.addEventListener(
    "abort",
    () => controller.abort(),
    { once: true }
  );
}

const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let accumulatedText = "";
  // Gemini's stream repeats/refines usage metadata, response id, model
  // version, and finish reason as it progresses — the LAST chunk carries
  // the authoritative values for those, so `latestChunk` is kept for them.
  // Function-call parts are NOT repeated this way: they appear only in the
  // specific chunk(s) that actually contain them, and a later text-only
  // refinement chunk carries none. Reading functionCalls off `latestChunk`
  // alone would silently lose the tool call the moment any chunk arrives
  // after it — so function calls are captured separately, the moment they
  // appear, and never overwritten by a later empty chunk.
  //
  // Captured from the raw response parts rather than the SDK's simplified
  // `chunk.functionCalls` convenience getter, because that getter strips
  // the `thoughtSignature` field — required by Gemini 3.x thinking models
  // and threaded back through on the next turn by toGeminiContents above.
  let latestChunk: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
  let capturedFunctionCallParts: Array<{
    id?: string;
    name: string;
    args: Record<string, unknown>;
    thoughtSignature?: string;
  }> = [];

  try {
    const streamResult = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction,
        temperature,
        topP: DEFAULT_TOP_P,
        maxOutputTokens,
        thinkingConfig: buildThinkingConfig(model),
        abortSignal: controller.signal,
        ...(tools
          ? {
              tools,
              toolConfig: options.toolChoice === "none" ? NO_FUNCTION_CALLING : AUTO_FUNCTION_CALLING,
            }
          : {}),
      },
    });

    for await (const chunk of streamResult) {
      latestChunk = chunk;

      const chunkParts = chunk.candidates?.[0]?.content?.parts;
      const chunkFunctionCallParts = chunkParts?.filter((part) => part.functionCall) ?? [];
      if (chunkFunctionCallParts.length > 0) {
        capturedFunctionCallParts = chunkFunctionCallParts.map((part) => ({
          id: part.functionCall!.id,
          name: part.functionCall!.name ?? "",
          args: (part.functionCall!.args ?? {}) as Record<string, unknown>,
          thoughtSignature: part.thoughtSignature,
        }));
      }

      // Only chunks whose candidate actually contains a text part have
      // real text. Reading `.text` on a functionCall-only chunk is what
      // triggers the SDK's "there are non-text parts functionCall..."
      // console warning — this check avoids that noise as well as any
      // risk of pulling in the wrong data.
      const hasTextPart = chunkParts?.some(
        (part) => typeof part.text === "string" && part.text.length > 0
      );

      if (hasTextPart) {
        let deltaText = "";
        try {
          deltaText = chunk.text ?? "";
        } catch {
          deltaText = "";
        }

        if (deltaText) {
          accumulatedText += deltaText;
          onChunk?.(deltaText);
        }
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);

    const isTimeout = error instanceof Error && error.name === "AbortError";
    if (isTimeout) {
      logger.error("Gemini error", { model, type: "timeout" });
      throw new AppError("AI service timed out. Please try again.", 503, true);
    }

    if (error instanceof ApiError) {
      logger.error("Gemini error", {
        model,
        type: "api_error",
        status: error.status,
        message: error.message,
      });

      if (error.status === 429) {
        throw new AppError("AI service is busy. Please wait a moment and try again.", 429, true);
      }
      if (error.status === 401 || error.status === 403) {
        throw new AppError("AI service authentication failed. Contact support.", 503, true);
      }
      throw new AppError("AI service returned an error. Please try again.", 502, true);
    }

    logger.error("Gemini error", { model, type: "network", error: String(error) });
    throw new AppError("AI service is unreachable. Please try again shortly.", 503, true);
  }

  clearTimeout(timeoutId);
  const latencyMs = Date.now() - start;

  const candidate = latestChunk?.candidates?.[0];
  if (!candidate) {
    logger.error("Gemini error", { model, type: "empty_response", latencyMs });
    throw new AppError("AI service returned an empty response. Please try again.", 502, true);
  }

  const toolCalls: OpenRouterToolCall[] | undefined =
    capturedFunctionCallParts.length > 0
      ? capturedFunctionCallParts.map((fc, index) => ({
          id: fc.id ?? `call_${Date.now()}_${index}`,
          type: "function" as const,
          function: {
            name: fc.name,
            arguments: JSON.stringify(fc.args),
          },
          thoughtSignature: fc.thoughtSignature,
        }))
      : undefined;

  if (toolCalls?.length) {
    logger.debug("Gemini tool calls", {
      model,
      latencyMs,
      tools: toolCalls.map((tc) => tc.function.name),
      // Visibility into whether the required-for-3.x signature was
      // actually present — a `false` here for a Gemini 3.x model is a
      // strong signal something's about to fail on the next turn.
      hasThoughtSignature: toolCalls.map((tc) => Boolean(tc.thoughtSignature)),
    });
  }

  const finishReason = mapFinishReason(candidate.finishReason, Boolean(toolCalls?.length));

  const choice: OpenRouterChoice = {
    message: {
      role: "assistant",
      content: accumulatedText || null,
      tool_calls: toolCalls,
    },
    finish_reason: finishReason,
    index: 0,
  };

  const usage = latestChunk?.usageMetadata
    ? {
        prompt_tokens: latestChunk.usageMetadata.promptTokenCount ?? 0,
        completion_tokens: latestChunk.usageMetadata.candidatesTokenCount ?? 0,
        total_tokens: latestChunk.usageMetadata.totalTokenCount ?? 0,
      }
    : undefined;

  const mapped: OpenRouterResponse = {
    id: latestChunk?.responseId ?? `gemini_${Date.now()}`,
    model: latestChunk?.modelVersion ?? model,
    choices: [choice],
    usage,
  };

  logger.debug("Gemini response", {
    model: mapped.model,
    latencyMs,
    finishReason,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
  });

  return { response: mapped, latencyMs };
}