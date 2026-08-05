import "server-only";
import { GoogleGenAI, ApiError, FunctionCallingConfigMode, ThinkingLevel } from "@google/genai";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { MESSAGE_ROLES } from "@/database/constants/ai";
import type { Content, FunctionDeclaration, ThinkingConfig } from "@google/genai";
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
  /**
   * Requested model. Retained for interface compatibility with callers,
   * but the actual model used is always resolved from the required
   * GEMINI_MODEL env var — see getConfig() — so a single env var
   * controls the model everywhere without touching call sites.
   */
  model: string;
  messages: OpenRouterMessage[];
  tools?: AiToolDefinition[];
  /**
   * When `tools` is provided: "auto" (default) lets the model call any of
   * them; "none" declares the same schema but explicitly forbids calling —
   * use this instead of omitting `tools` to end a function-calling loop,
   * since dropping the schema abruptly is what causes some Gemini 3.x
   * models to still attempt (and fail) a function call anyway. See
   * NO_FUNCTION_CALLING below.
   */
  toolChoice?: "auto" | "none";
  /** 0–1. Defaults to 0.4 — tuned for consistent, deterministic answers. */
  temperature?: number;
  maxTokens?: number;
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

// ── Request mapping: OpenRouter-shaped messages → Gemini `contents` ───────────

/**
 * Converts the flat OpenRouter-style message array (as built by
 * chat.service.ts) into Gemini's `systemInstruction` + `contents` shape.
 *
 * Notes on fidelity:
 * - The system message becomes `systemInstruction` (Gemini's idiomatic
 *   equivalent), rather than a turn in the conversation.
 * - "tool" role messages (only present on chat.service.ts's second,
 *   post-tool-execution call, which never includes `tools`) are folded in
 *   as plain-text "user" turns describing the tool result. Gemini isn't
 *   asked to call further tools on that pass — it only needs the data to
 *   compose its final answer — so this keeps the mapping simple and robust
 *   without depending on tool_call_id correlation, which Gemini doesn't use.
 * - Empty-content assistant turns (the synthetic placeholder chat.service.ts
 *   inserts for the turn where the model requested tool calls) are skipped
 *   rather than sent as empty parts, which Gemini rejects.
 */
function toGeminiContents(messages: OpenRouterMessage[]): {
  systemInstruction?: string;
  contents: Content[];
} {
  let systemInstruction: string | undefined;
  const contents: Content[] = [];

  for (const raw of messages) {
    const msg = raw as OpenRouterMessage | WireToolResultMessage;

    if (msg.role === MESSAGE_ROLES.SYSTEM) {
      systemInstruction = systemInstruction
        ? `${systemInstruction}\n\n${msg.content}`
        : msg.content;
      continue;
    }

    if (msg.role === "tool") {
      const toolMsg = msg as WireToolResultMessage;
      contents.push({
        role: "user",
        parts: [{ text: `[Tool result — ${toolMsg.name}]\n${toolMsg.content}` }],
      });
      continue;
    }

    if (msg.role === MESSAGE_ROLES.ASSISTANT) {
      if (!msg.content) continue;
      contents.push({ role: "model", parts: [{ text: msg.content }] });
      continue;
    }

    // "user"
    contents.push({ role: "user", parts: [{ text: msg.content }] });
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
  let latestChunk: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
  let capturedFunctionCalls: NonNullable<
    Awaited<ReturnType<typeof ai.models.generateContent>>["functionCalls"]
  > = [];

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

      const chunkFunctionCalls = chunk.functionCalls;
      if (chunkFunctionCalls && chunkFunctionCalls.length > 0) {
        capturedFunctionCalls = chunkFunctionCalls;
      }

      // Only chunks whose candidate actually contains a text part have
      // real text. Reading `.text` on a functionCall-only chunk is what
      // triggers the SDK's "there are non-text parts functionCall..."
      // console warning — this check avoids that noise as well as any
      // risk of pulling in the wrong data.
      const hasTextPart = chunk.candidates?.[0]?.content?.parts?.some(
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

  const functionCalls = capturedFunctionCalls;
  const toolCalls: OpenRouterToolCall[] | undefined =
    functionCalls.length > 0
      ? functionCalls.map((fc, index) => ({
          id: fc.id ?? `call_${Date.now()}_${index}`,
          type: "function" as const,
          function: {
            name: fc.name ?? "",
            arguments: JSON.stringify(fc.args ?? {}),
          },
        }))
      : undefined;

  if (toolCalls?.length) {
    logger.debug("Gemini tool calls", {
      model,
      latencyMs,
      tools: toolCalls.map((tc) => tc.function.name),
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