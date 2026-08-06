import "server-only";
import connectToDatabase from "@/database/connection";
import { Conversation, Message } from "@/database/models/Conversation";
import { MESSAGE_ROLES } from "@/database/constants/ai";
import { logger } from "@/lib/logging/logger";
import { recordConversationStarted } from "@/lib/ai/analytics";
import type { ConversationDocument, MessageDocument } from "@/database/models/Conversation";
import type { AiModel, MessageRole } from "@/database/constants/ai";
import type { ITokenUsage, IToolCall } from "@/types/ai";

// ── Conversation ──────────────────────────────────────────────────────────────

export async function findOrCreateConversation(params: {
  conversationId?: string;
  sessionId: string;
  clerkUserId?: string;
  aiModel: AiModel;
}): Promise<ConversationDocument> {
  await connectToDatabase();

  if (params.conversationId) {
    // Ownership check. Always requires the conversationId + sessionId
    // to match, and — when the caller is authenticated — also requires
    // the conversation's clerkUserId to match theirs. This is what
    // prevents one authenticated user from ever attaching to another
    // authenticated user's conversation, even if a stale/shared
    // sessionId were somehow presented. Anonymous callers (no
    // clerkUserId) keep the original conversationId + sessionId check.
    const ownershipQuery: Record<string, unknown> = {
      _id: params.conversationId,
      sessionId: params.sessionId,
      status: "active",
    };
    if (params.clerkUserId) {
      ownershipQuery.clerkUserId = params.clerkUserId;
    }

    const existing = await Conversation.findOne(ownershipQuery);

    if (existing) return existing;

    // Log the miss but do not throw — gracefully create a new conversation
    // so a stale/expired conversationId doesn't break the user's session.
    logger.warn("Conversation not found or not owned by session — creating new", {
      conversationId: params.conversationId,
      sessionId: params.sessionId,
    });
  }

  const created = await Conversation.create({
    sessionId: params.sessionId,
    clerkUserId: params.clerkUserId,
    aiModel: params.aiModel,
  });

  await recordConversationStarted();
  return created;
}

export async function getConversationHistory(
  conversationId: string,
  limit = 20
): Promise<MessageDocument[]> {
  await connectToDatabase();

  // Fetch most recent `limit` messages, then reverse so the array is
  // oldest-first — which is the order the model expects.
  //
  // toolCalls is now included in the projection — it was previously
  // omitted here, which meant chat.service.ts's cross-turn dedupe cache
  // (buildHistoricalToolCallCache) was silently seeding from an array of
  // messages that all had `toolCalls: undefined`, regardless of what was
  // actually in the database. That made the "don't re-show a card the
  // customer already saw" fix a no-op in practice. formatHistoryForPrompt
  // below still only sends role/content to the model, so this doesn't
  // change prompt size — it only makes the field available to the
  // dedupe cache builder.
  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role content toolCalls createdAt updatedAt")
    .lean();

  return messages.reverse() as unknown as MessageDocument[];
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function saveUserMessage(
  conversationId: string,
  content: string
): Promise<MessageDocument> {
  await connectToDatabase();

  // Use a session to write message + update conversation atomically,
  // preventing a partial write where the message exists but the counter
  // isn't incremented (or vice versa) if the server crashes mid-request.
  const dbSession = await Message.startSession();
  let savedMessage: MessageDocument;

  try {
    await dbSession.withTransaction(async () => {
      const [message] = await Message.create(
        [{ conversation: conversationId, role: MESSAGE_ROLES.USER, content }],
        { session: dbSession }
      );
      savedMessage = message;

      await Conversation.findByIdAndUpdate(
        conversationId,
        { $inc: { messageCount: 1 }, lastMessageAt: new Date() },
        { session: dbSession }
      );
    });
  } finally {
    await dbSession.endSession();
  }

  return savedMessage!;
}

export async function saveAssistantMessage(
  conversationId: string,
  content: string,
  options: {
    toolCalls?: IToolCall[];
    tokenUsage?: ITokenUsage;
    latencyMs?: number;
  } = {}
): Promise<MessageDocument> {
  await connectToDatabase();

  const dbSession = await Message.startSession();
  let savedMessage: MessageDocument;

  try {
    await dbSession.withTransaction(async () => {
      const [message] = await Message.create(
        [
          {
            conversation: conversationId,
            role: MESSAGE_ROLES.ASSISTANT,
            content,
            toolCalls: options.toolCalls ?? [],
            tokenUsage: options.tokenUsage,
            latencyMs: options.latencyMs,
          },
        ],
        { session: dbSession }
      );
      savedMessage = message;

      // Build the $inc update. messageCount always increments; token
      // fields only when usage data is present.
      const inc: Record<string, number> = { messageCount: 1 };

      if (options.tokenUsage) {
        inc["totalTokenUsage.promptTokens"] = options.tokenUsage.promptTokens;
        inc["totalTokenUsage.completionTokens"] = options.tokenUsage.completionTokens;
        inc["totalTokenUsage.totalTokens"] = options.tokenUsage.totalTokens;
      }

      await Conversation.findByIdAndUpdate(
        conversationId,
        { $inc: inc, lastMessageAt: new Date() },
        { session: dbSession }
      );
    });
  } finally {
    await dbSession.endSession();
  }

  return savedMessage!;
}

// ── Formatting ────────────────────────────────────────────────────────────────

/**
 * Converts stored MessageDocuments into the flat role/content pairs
 * that OpenRouter expects. System messages are excluded — the system
 * prompt is injected fresh on every turn by the chat service.
 */
export function formatHistoryForPrompt(
  messages: MessageDocument[]
): Array<{ role: MessageRole; content: string }> {
  return messages
    .filter((m) => m.role !== MESSAGE_ROLES.SYSTEM)
    .map((m) => ({ role: m.role, content: m.content }));
}