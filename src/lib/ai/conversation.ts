import "server-only";
import connectToDatabase from "@/database/connection";
import { Conversation, Message } from "@/database/models/Conversation";
import { MESSAGE_ROLES } from "@/database/constants/ai";
import { logger } from "@/lib/logging/logger";
import type { ConversationDocument, MessageDocument } from "@/database/models/Conversation";
import type { AiModel } from "@/database/constants/ai";
import type { ITokenUsage, IToolCall } from "@/types/ai";

// ── Conversation ──────────────────────────────────────────────────────────────

export async function findOrCreateConversation(params: {
  conversationId?: string;
  sessionId: string;
  clerkUserId?: string;
  model: AiModel;
}): Promise<ConversationDocument> {
  await connectToDatabase();

  if (params.conversationId) {
    // Validate that the conversation belongs to this session — prevents
    // one user from hijacking another user's conversation by guessing IDs.
    const existing = await Conversation.findOne({
      _id: params.conversationId,
      sessionId: params.sessionId,
      status: "active",
    });

    if (existing) return existing;

    // Log the miss but do not throw — gracefully create a new conversation
    // so a stale/expired conversationId doesn't break the user's session.
    logger.warn("Conversation not found or not owned by session — creating new", {
      conversationId: params.conversationId,
      sessionId: params.sessionId,
    });
  }

  return Conversation.create({
    sessionId: params.sessionId,
    clerkUserId: params.clerkUserId,
    model: params.model,
  });
}

export async function getConversationHistory(
  conversationId: string,
  limit = 20
): Promise<MessageDocument[]> {
  await connectToDatabase();

  // Fetch most recent `limit` messages, then reverse so the array is
  // oldest-first — which is the order the model expects.
  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role content createdAt updatedAt")
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
): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => m.role !== MESSAGE_ROLES.SYSTEM)
    .map((m) => ({ role: m.role, content: m.content }));
}
