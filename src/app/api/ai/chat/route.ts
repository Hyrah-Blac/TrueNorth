import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import { randomBytes } from "crypto";
import { runChat } from "@/lib/ai/chat.service";
import { chatRequestSchema } from "@/lib/ai/chat.schema";
import { handleApiError, resolveErrorMessage } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse } from "@/middleware/rate-limit";
import { logger } from "@/lib/logging/logger";
import { AI_MODELS } from "@/database/constants/ai";
import type { ChatStreamEvent } from "@/types/ai";

// Signed-in users get a more generous allowance; anonymous users are
// tighter because the key is IP-based (shared IPs on mobile carriers /
// offices could otherwise block each other).
const AI_RATE_LIMIT_AUTHED = { windowMs: 60_000, max: 30 } as const;
const AI_RATE_LIMIT_ANON = { windowMs: 60_000, max: 10 } as const;

/**
 * POST /api/ai/chat
 *
 * Accepts a user message and streams back an AI concierge response as
 * Server-Sent Events. Authentication is optional — signed-in users get
 * their Clerk ID linked to the conversation for history continuity;
 * anonymous users are tracked by a client-supplied (or server-generated)
 * sessionId.
 *
 * Request body (all fields except `message` are optional):
 *   {
 *     message:        string   1–2000 chars
 *     conversationId: string   MongoDB ObjectId — continues an existing conversation
 *     sessionId:      string   client-generated identifier — anonymous continuity
 *     model:          string   AI model override
 *     pageContext:    string   short description of the page the visitor is on
 *   }
 *
 * Response: `Content-Type: text/event-stream`. Each event is one JSON
 * object per line, prefixed `data: `:
 *   { type: "tool_status", label: string }
 *   { type: "chunk", delta: string }
 *   { type: "done", conversationId, sessionId, message: IMessage, tokenUsage? }
 *   { type: "error", message: string }
 *
 * Validation, rate limiting, and auth all happen before any bytes are
 * sent — those failures still return normal JSON error responses with
 * the appropriate HTTP status. Once streaming begins, the HTTP status is
 * already 200; a failure inside runChat is reported as an "error" event
 * within the stream instead, since the status code can no longer change.
 *
 * Client disconnects mid-stream: if the visitor navigates away or the
 * connection drops while `runChat` is still emitting events, the platform
 * calls the stream's `cancel()` and the underlying controller becomes
 * invalid. `runChat` has no way to know that happened and will keep
 * calling `send()`, so every write (and the final `close()` in `finally`)
 * is guarded by a `closed` flag that's flipped in both `cancel()` and
 * after a normal close, turning post-disconnect writes into no-ops
 * instead of an unhandled `ERR_INVALID_STATE` throw.
 *
 * Silencing writes isn't enough on its own — `runChat` would otherwise
 * keep talking to the model provider for the full duration of the call
 * even though nobody can see the output anymore, burning the exact
 * per-token cost this route is rate-limited to protect against. `cancel()`
 * also aborts a shared `AbortController` whose signal is threaded into
 * `runChat`, so the in-flight provider call is torn down as soon as the
 * client leaves rather than running to completion (or timeout) unread.
 */
// Node.js runtime is required here (not Edge) — the Mongoose connection
// in src/database/connection.ts uses the `dns` module and other
// Node-only APIs, and the @google/genai SDK is imported via a
// "server-only" module elsewhere in this call chain.
export const runtime = "nodejs";

// Worst case for a single turn: up to MAX_TOOL_ROUNDS (4) tool-calling
// rounds plus one no-usable-text retry — see chat.service.ts — each a
// full model call bounded by GEMINI_TIMEOUT_MS (30s) in client.ts. That's
// up to ~150s of provider time alone, before tool execution and DB
// writes. Vercel's platform default for a route with no explicit
// maxDuration isn't guaranteed to cover that, and a mid-stream kill here
// is indistinguishable from a hang to the client. Pin it explicitly
// rather than relying on the default. Requires Fluid Compute (default
// for new projects) and a plan that supports this duration — see
// https://vercel.com/docs/functions/configuring-functions/duration.
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  // 1. Resolve authenticated user — auth() never throws for anonymous requests.
  //    Done first so we can pick the right rate-limit bucket before any other work.
  const { userId: clerkUserId } = await auth();

  // 2. Rate limit — tighter for anonymous (IP-keyed) than for signed-in users.
  const rateLimit = clerkUserId ? AI_RATE_LIMIT_AUTHED : AI_RATE_LIMIT_ANON;
  const rate = checkRateLimit(getRequestKey(req, "ai:chat"), rateLimit);
  if (!rate.allowed) return rateLimitResponse(rate);

  // 3. Parse body — return 400 for missing/empty body rather than crashing
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return handleApiError(
      new ZodError([{ code: "custom", path: ["body"], message: "Request body must be valid JSON" }]),
      "POST /api/ai/chat"
    );
  }

  let input: ReturnType<typeof chatRequestSchema.parse>;
  try {
    // 4. Validate with Zod
    input = chatRequestSchema.parse(rawBody);
  } catch (error) {
    return handleApiError(error, "POST /api/ai/chat");
  }

  // 5. Derive stable session ID — auth already resolved above
  //    Priority: client-supplied → Clerk user ID → server-generated random
  //    Signed-in users get automatic cross-tab continuity via their Clerk ID.
  const sessionId = input.sessionId ?? clerkUserId ?? randomBytes(16).toString("hex");

  logger.info("AI chat request", {
    sessionId,
    clerkUserId: clerkUserId ?? "anonymous",
    hasConversationId: Boolean(input.conversationId),
    model: input.model ?? AI_MODELS.DEFAULT,
    messageLength: input.message.length,
  });

  const encoder = new TextEncoder();

  // Flips true either after a normal close() or if the client disconnects
  // and the platform invokes cancel(). Declared outside start() so both
  // start() and cancel() share the same flag — once true, send() and the
  // finally-block close() become no-ops so we never touch an invalidated
  // controller.
  let closed = false;

  // Aborted from cancel() so runChat can stop mid-flight (e.g. tear down
  // the in-progress provider request) instead of running to completion
  // after the client has already disconnected.
  const abortController = new AbortController();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch (error) {
          // Controller went invalid between our check and the enqueue
          // (e.g. disconnect raced us) — treat as closed and move on.
          closed = true;
          logger.warn("AI chat stream enqueue failed after close", {
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      };

      try {
        // 6. Run chat — emits tool_status/chunk/done events as it goes
        await runChat(
          {
            userMessage: input.message,
            conversationId: input.conversationId,
            sessionId,
            clerkUserId: clerkUserId ?? undefined,
            model: input.model,
            pageContext: input.pageContext,
            signal: abortController.signal,
          },
          send
        );
      } catch (error) {
        // If we aborted because the client disconnected, this is expected
        // (AbortError or similar) — there's no one to send an error event
        // to, and send() is a no-op once closed anyway. Don't log it as a
        // real failure.
        if (abortController.signal.aborted) {
          logger.info("AI chat aborted after client disconnect", { sessionId });
          return;
        }
        const { message } = resolveErrorMessage(error, "POST /api/ai/chat (stream)");
        send({ type: "error", message });
      } finally {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // Already closed/errored by the platform — nothing to do.
          }
        }
      }
    },
    cancel(reason) {
      // Client disconnected (nav away, tab close, fetch aborted). Mark the
      // stream closed immediately so any send() still in flight inside
      // runChat becomes a no-op instead of throwing ERR_INVALID_STATE —
      // and abort the shared signal so runChat actually stops doing work
      // (e.g. cancels the in-flight provider request) rather than running
      // to completion for a response nobody will ever read.
      closed = true;
      abortController.abort(reason);
      logger.info("AI chat stream cancelled by client", {
        sessionId,
        reason: reason instanceof Error ? reason.message : String(reason ?? "unknown"),
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}