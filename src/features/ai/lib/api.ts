import type { ChatRequest, ChatResponse } from "@/types/ai";
import type { ConciergeError } from "../types";

const REQUEST_TIMEOUT_MS = 30_000;

class ConciergeApiError extends Error {
  kind: ConciergeError["kind"];

  constructor(kind: ConciergeError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

/**
 * Calls the existing POST /api/ai/chat endpoint. This is the ONLY
 * network call the Concierge frontend makes — no parallel endpoint is
 * introduced, per the backend contract.
 */
export async function sendConciergeMessage(
  payload: ChatRequest,
  signal?: AbortSignal
): Promise<ChatResponse> {
  if (isBrowser() && !window.navigator.onLine) {
    throw new ConciergeApiError("offline", "You appear to be offline. Please check your connection.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Let an external abort (e.g. the panel closing mid-request) cancel
  // the fetch too, without losing our own timeout-driven abort.
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", () => controller.abort());

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new ConciergeApiError(
        "rate_limited",
        "The concierge is receiving a high volume of requests. Please try again in a moment."
      );
    }

    if (response.status >= 500) {
      throw new ConciergeApiError("server", "The concierge is temporarily unavailable. Please try again.");
    }

    if (!response.ok) {
      const body = await safeParseJson(response);
      const message = (body as { error?: string } | null)?.error ?? "Something went wrong. Please try again.";
      throw new ConciergeApiError("unknown", message);
    }

    const body = (await response.json()) as { success: boolean; data: ChatResponse };
    return body.data;
  } catch (error) {
    if (error instanceof ConciergeApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ConciergeApiError("timeout", "That took longer than expected. Please try again.");
    }

    throw new ConciergeApiError("unknown", "Something went wrong. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

export function toConciergeError(error: unknown): ConciergeError {
  if (error instanceof ConciergeApiError) {
    return { kind: error.kind, message: error.message };
  }
  return { kind: "unknown", message: "Something went wrong. Please try again." };
}

function isBrowser() {
  return typeof window !== "undefined";
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
