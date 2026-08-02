import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import {
  CONVERSATION_STATUS_VALUES,
  CONVERSATION_STATUSES,
  MESSAGE_ROLE_VALUES,
  AI_MODEL_VALUES,
  AI_MODELS,
  type ConversationStatus,
  type MessageRole,
  type AiModel,
} from "../constants/ai";

// ── Message ───────────────────────────────────────────────────────────────────

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface MessageDocument extends Document {
  conversation: Types.ObjectId;
  role: MessageRole;
  content: string;
  toolCalls: ToolCall[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Wall-clock time from first-byte-sent to last-byte-received, ms. */
  latencyMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ToolCallSchema = new Schema<ToolCall>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    arguments: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const TokenUsageSchema = new Schema(
  {
    promptTokens: { type: Number, min: 0, default: 0 },
    completionTokens: { type: Number, min: 0, default: 0 },
    totalTokens: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const MessageSchema = new Schema<MessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: MESSAGE_ROLE_VALUES,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32_000,
    },
    toolCalls: { type: [ToolCallSchema], default: [] },
    tokenUsage: { type: TokenUsageSchema, default: undefined },
    latencyMs: { type: Number, min: 0 },
  },
  { timestamps: true }
);

// Compound index for history retrieval — the most common query pattern
MessageSchema.index({ conversation: 1, createdAt: 1 });

export const Message: Model<MessageDocument> =
  models.Message || model<MessageDocument>("Message", MessageSchema);

// ── Conversation ──────────────────────────────────────────────────────────────

export interface ConversationDocument extends Document {
  /** Clerk user ID — undefined for anonymous (unauthenticated) sessions. */
  clerkUserId?: string;
  /** Browser-generated session ID for anonymous continuity across requests. */
  sessionId: string;
  model: AiModel;
  status: ConversationStatus;
  totalTokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<ConversationDocument>(
  {
    clerkUserId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
      maxlength: 100,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 128,
    },
    model: {
      type: String,
      enum: AI_MODEL_VALUES,
      default: AI_MODELS.DEFAULT,
    },
    status: {
      type: String,
      enum: CONVERSATION_STATUS_VALUES,
      default: CONVERSATION_STATUSES.ACTIVE,
      index: true,
    },
    totalTokenUsage: {
      type: new Schema(
        {
          promptTokens: { type: Number, default: 0, min: 0 },
          completionTokens: { type: Number, default: 0, min: 0 },
          totalTokens: { type: Number, default: 0, min: 0 },
        },
        { _id: false }
      ),
      default: () => ({ promptTokens: 0, completionTokens: 0, totalTokens: 0 }),
    },
    messageCount: { type: Number, default: 0, min: 0 },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Session lookup (most common public query)
ConversationSchema.index({ sessionId: 1, status: 1 });
// Auth'd user history
ConversationSchema.index({ clerkUserId: 1, status: 1 });
// Admin dashboard ordering
ConversationSchema.index({ lastMessageAt: -1 });

export const Conversation: Model<ConversationDocument> =
  models.Conversation ||
  model<ConversationDocument>("Conversation", ConversationSchema);

export default Conversation;
