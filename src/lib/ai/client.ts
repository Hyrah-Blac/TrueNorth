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

function buildThinkingConfig(model: string): ThinkingConfig {
  const isGemini3 = /gemini-3/i.test(model);
  if (isGemini3) {
    return { thinkingLevel: ThinkingLevel.MEDIUM };
  }
  return { thinkingBudget: 512 };
}

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

interface WireToolResultMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}

interface WireAssistantToolCallMessage {
  role: "assistant";
  content: string;
  tool_calls?: OpenRouterToolCall[];
}

// ── Request mapping ───────────────────────────────────────────────────────────

function toGeminiContents(messages: OpenRouterMessage[]): {
  systemInstruction?: string;
  contents: Content[];
} {
  let systemInstruction: string | undefined;
  const contents: Content[] = [];
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
            // Leave empty — mirrors executor.ts's own tolerant handling.
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
    parametersJsonSchema: tool.function.parameters,
  };
}

const toolsCache = new WeakMap
 < AiToolDefinition[],
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

const AUTO_FUNCTION_CALLING = {
  functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
} as const;

const NO_FUNCTION_CALLING = {
  functionCallingConfig: { mode: FunctionCallingConfigMode.NONE },
} as const;

// ── Response mapping ──────────────────────────────────────────────────────────

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

  // Build a single AbortController that fires on whichever comes first:
  // the hard timeout, or the caller's own cancellation signal (e.g. client
  // disconnect from chat.service.ts). Both sources abort the same
  // controller so the Gemini SDK stream is torn down cleanly in either case.
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException("Gemini request timed out", "TimeoutError"));
  }, GEMINI_TIMEOUT_MS);

  // Forward caller's cancellation (e.g. client disconnect) into our controller.
  options.signal?.addEventListener("abort", () => controller.abort(options.signal!.reason), {
    once: true,
  });

  let accumulatedText = "";
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
              toolConfig:
                options.toolChoice === "none" ? NO_FUNCTION_CALLING : AUTO_FUNCTION_CALLING,
            }
          : {}),
      },
    });

    for await (const chunk of streamResult) {
      latestChunk = chunk;

      const chunkParts = chunk.candidates?.[0]?.content?.parts;
      const chunkFunctionCallParts = chunkParts?.filter((part) => part.functionCall) ?? [];
      if (chunkFunctionCallParts.length > 0) {
        capturedFunctionCallParts = chunkFunctionCallParts.map((part, index) => ({
          id: part.functionCall!.id,
          name: part.functionCall!.name ?? "",
          args: (part.functionCall!.args ?? {}) as Record<string, unknown>,
          thoughtSignature:
            part.thoughtSignature ?? capturedFunctionCallParts[index]?.thoughtSignature,
        }));
      }

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

    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");

    if (isTimeout) {
      // Don't report a timeout if the caller themselves cancelled — that's
      // expected (client disconnect, navigation) and logged separately.
      if (options.signal?.aborted) throw error;
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