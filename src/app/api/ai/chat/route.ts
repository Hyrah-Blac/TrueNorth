import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import { randomBytes } from "crypto";
import { runChat } from "@/lib/ai/chat.service";
import { chatRequestSchema } from "@/lib/ai/chat.schema";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse } from "@/middleware/rate-limit";
import { logger } from "@/lib/logging/logger";
import { AI_MODELS } from "@/database/constants/ai";

// Stricter than the general PUBLIC_WRITE limit — LLM calls have real
// per-token cost so we protect them more aggressively.
const AI_RATE_LIMIT = { windowMs: 60_000, max: 20 } as const;

/**
 * POST /api/ai/chat
 *
 * Accepts a user message and returns an AI concierge response.
 * Authentication is optional — signed-in users get their Clerk ID
 * linked to the conversation for history continuity; anonymous users
 * are tracked by a client-supplied (or server-generated) sessionId.
 *
 * Request body (all fields except `message` are optional):
 *   {
 *     message:        string   1–2000 chars
 *     conversationId: string   MongoDB ObjectId — continues an existing conversation
 *     sessionId:      string   client-generated identifier — anonymous continuity
 *     model:          string   AI model override
 *   }
 *
 * Success response 200:
 *   {
 *     success: true,
 *     data: {
 *       conversationId: string
 *       sessionId:      string
 *       message: {
 *         _id, conversationId, role, content,
 *         toolCalls, tokenUsage?, latencyMs?,
 *         createdAt, updatedAt
 *       }
 *       tokenUsage?: { promptTokens, completionTokens, totalTokens }
 *     }
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit
    const rate = checkRateLimit(getRequestKey(req, "ai:chat"), AI_RATE_LIMIT);
    if (!rate.allowed) return rateLimitResponse(rate);

    // 2. Parse body — return 400 for missing/empty body rather than crashing
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return handleApiError(
        new ZodError([
          { code: "custom", path: ["body"], message: "Request body must be valid JSON" },
        ]),
        "POST /api/ai/chat"
      );
    }

    // 3. Validate with Zod
    const input = chatRequestSchema.parse(rawBody);

    // 4. Resolve authenticated user — auth() never throws for anonymous requests
    const { userId: clerkUserId } = await auth();

    // 5. Derive stable session ID
    //    Priority: client-supplied → Clerk user ID → server-generated random
    //    Signed-in users get automatic cross-tab continuity via their Clerk ID.
    const sessionId =
      input.sessionId ??
      clerkUserId ??
      randomBytes(16).toString("hex");

    logger.info("AI chat request", {
      sessionId,
      clerkUserId: clerkUserId ?? "anonymous",
      hasConversationId: Boolean(input.conversationId),
      model: input.model ?? AI_MODELS.DEFAULT,
      messageLength: input.message.length,
    });

    // 6. Run chat
    const result = await runChat({
      userMessage: input.message,
      conversationId: input.conversationId,
      sessionId,
      clerkUserId: clerkUserId ?? undefined,
      model: input.model,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "POST /api/ai/chat");
  }
}
