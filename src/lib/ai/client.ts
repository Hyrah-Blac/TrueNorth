import "server-only";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import type { OpenRouterMessage, OpenRouterResponse, AiToolDefinition } from "@/types/ai";

// ── Config ────────────────────────────────────────────────────────────────────

const OPENROUTER_TIMEOUT_MS = 30_000;
const FALLBACK_BASE_URL = "https://openrouter.ai/api/v1";

function getConfig(): { baseUrl: string; apiKey: string; siteUrl: string } {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "AI service is not configured. OPENROUTER_API_KEY is missing.",
      503,
      true
    );
  }

  const baseUrl = (process.env.OPENROUTER_BASE_URL ?? FALLBACK_BASE_URL).replace(/\/$/, "");
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://truenorthcharters.co.ke";

  return { apiKey, baseUrl, siteUrl };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompletionOptions {
  model: string;
  messages: OpenRouterMessage[];
  tools?: AiToolDefinition[];
  /** 0–1. Defaults to 0.7. */
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  response: OpenRouterResponse;
  latencyMs: number;
}

// ── Client ────────────────────────────────────────────────────────────────────

/**
 * The single point of contact between this application and OpenRouter.
 * No other file may call the OpenRouter API directly.
 *
 * Handles:
 * - Timeout via AbortController (30 s default)
 * - Network failures (fetch rejects)
 * - Non-2xx HTTP responses (parsed and re-thrown as AppError)
 * - Malformed JSON responses (caught and re-thrown)
 * - Missing choices in a structurally valid response
 */
export async function createCompletion(options: CompletionOptions): Promise<CompletionResult> {
  const { baseUrl, apiKey, siteUrl } = getConfig();
  const start = Date.now();

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
    body.tool_choice = "auto";
  }

  logger.debug("OpenRouter request", {
    model: options.model,
    messageCount: options.messages.length,
    hasTools: Boolean(options.tools?.length),
  });

  // Timeout guard — Vercel serverless functions have a hard wall-clock
  // limit; without this the function hangs until platform timeout which
  // produces a 504 with no useful error message.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": siteUrl,
        "X-Title": "True North Charters AI Concierge",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    const isTimeout =
      fetchError instanceof Error && fetchError.name === "AbortError";
    const message = isTimeout
      ? "AI service timed out. Please try again."
      : "AI service is unreachable. Please try again shortly.";
    logger.error("OpenRouter fetch failed", {
      model: options.model,
      isTimeout,
      error: String(fetchError),
    });
    throw new AppError(message, 503, true);
  }

  clearTimeout(timeoutId);
  const latencyMs = Date.now() - start;

  // Non-2xx — parse body for a useful error message but never expose
  // raw provider errors to callers (they may contain model details or
  // internal routing info).
  if (!res.ok) {
    const rawBody = await res.text().catch(() => "(unreadable body)");
    logger.error("OpenRouter non-2xx response", {
      status: res.status,
      model: options.model,
      body: rawBody,
    });

    if (res.status === 429) {
      throw new AppError("AI service is busy. Please wait a moment and try again.", 429, true);
    }
    if (res.status === 401 || res.status === 403) {
      throw new AppError("AI service authentication failed. Contact support.", 503, true);
    }
    throw new AppError("AI service returned an error. Please try again.", 502, true);
  }

  // Parse JSON defensively — a truncated or malformed response must not
  // crash the server with an unhandled exception.
  let data: OpenRouterResponse;
  try {
    data = (await res.json()) as OpenRouterResponse;
  } catch {
    logger.error("OpenRouter response JSON parse failed", { model: options.model, latencyMs });
    throw new AppError("AI service returned an unreadable response. Please try again.", 502, true);
  }

  if (!Array.isArray(data.choices) || data.choices.length === 0) {
    logger.error("OpenRouter response has no choices", { model: options.model, data });
    throw new AppError("AI service returned an empty response. Please try again.", 502, true);
  }

  logger.debug("OpenRouter response received", {
    model: data.model,
    latencyMs,
    totalTokens: data.usage?.total_tokens,
    finishReason: data.choices[0]?.finish_reason,
  });

  return { response: data, latencyMs };
}
