import type { ChatRequest, ChatResponse, ChatStreamEvent } from "@/types/ai";
import type { ConciergeError } from "../types";

const REQUEST_TIMEOUT_MS = 30_000;

class ConciergeApiError extends Error {
  kind: ConciergeError["kind"];

  constructor(kind: ConciergeError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface ConciergeStreamCallbacks {
  /** Fires while a tool call is in flight, e.g. "Searching aircraft…" */
  onToolStatus?: (label: string) => void;
  /** Fires as the reply is progressively delivered. */
  onChunk?: (delta: string) => void;
  /** Fires exactly once, on success. */
  onDone: (response: ChatResponse) => void;
  /** Fires exactly once, on failure. Never fires alongside onDone. */
  onError: (error: ConciergeError) => void;
}

/**
 * Calls the existing POST /api/ai/chat endpoint. This is the ONLY
 * network call the Concierge frontend makes — no parallel endpoint is
 * introduced, per the backend contract. The response is a Server-Sent
 * Events stream; results are delivered via `callbacks` rather than a
 * return value.
 */
export async function sendConciergeMessage(
  payload: ChatRequest,
  callbacks: ConciergeStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  if (isBrowser() && !window.navigator.onLine) {
    callbacks.onError({ kind: "offline", message: "You appear to be offline. Please check your connection." });
    return;
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

    await consumeEventStream(response, callbacks);
  } catch (error) {
    callbacks.onError(toConciergeError(error));
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Reads the SSE body incrementally, parsing `data: {...}` lines
 * separated by blank lines into typed ChatStreamEvents and dispatching
 * them to the matching callback as they arrive.
 */
async function consumeEventStream(response: Response, callbacks: ConciergeStreamCallbacks): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError({ kind: "unknown", message: "Streaming isn't supported in this browser." });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let settled = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      if (!rawEvent.startsWith("data:")) continue;
      const jsonStr = rawEvent.slice(5).trim();
      if (!jsonStr) continue;

      let event: ChatStreamEvent;
      try {
        event = JSON.parse(jsonStr) as ChatStreamEvent;
      } catch {
        continue; // Skip a malformed frame rather than aborting the stream.
      }

      if (event.type === "tool_status") {
        callbacks.onToolStatus?.(event.label);
      } else if (event.type === "chunk") {
        callbacks.onChunk?.(event.delta);
      } else if (event.type === "done") {
        settled = true;
        callbacks.onDone({
          conversationId: event.conversationId,
          sessionId: event.sessionId,
          message: event.message,
          tokenUsage: event.tokenUsage,
        });
        return;
      } else if (event.type === "error") {
        settled = true;
        callbacks.onError({ kind: "server", message: event.message });
        return;
      }
    }
  }

  if (!settled) {
    callbacks.onError({ kind: "unknown", message: "Connection lost before the reply finished. Please try again." });
  }
}

export function toConciergeError(error: unknown): ConciergeError {
  if (error instanceof ConciergeApiError) {
    return { kind: error.kind, message: error.message };
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return { kind: "timeout", message: "That took longer than expected. Please try again." };
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