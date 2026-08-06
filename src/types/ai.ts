import type { AiModel, ConversationStatus, MessageRole, AiToolName } from "@/database/constants/ai";

export type { AiModel, ConversationStatus, MessageRole, AiToolName };

// ── Message & Conversation shapes returned to the client ─────────────────────

export interface ITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface IToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolCalls: IToolCall[];
  tokenUsage?: ITokenUsage;
  latencyMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  sessionId: string;
  clerkUserId?: string;
  model: AiModel;
  status: ConversationStatus;
  totalTokenUsage: ITokenUsage;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── OpenRouter wire types ─────────────────────────────────────────────────────

export interface OpenRouterMessage {
  role: MessageRole;
  content: string;
}

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
  /**
   * Gemini 3.x thinking models attach an opaque signature to their
   * functionCall response parts (typically only the first, for a batch of
   * parallel calls) and require it echoed back verbatim on the turn where
   * that call is resent as conversation history — omitting it is a
   * documented cause of "malformed_function_call" / 400 errors on the
   * next turn. Unused (undefined) for non-Gemini-3 models. See
   * client.ts's toGeminiContents for where this gets threaded through.
   */
  thoughtSignature?: string;
}
export interface OpenRouterChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: OpenRouterToolCall[];
  };
  finish_reason: string;
  index: number;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage?: OpenRouterUsage;
}

// ── Tool definitions sent to OpenRouter ──────────────────────────────────────

export interface AiToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
}

export interface AiToolDefinition {
  type: "function";
  function: {
    name: AiToolName;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, AiToolParameter>;
      required: string[];
    };
  };
}

// ── Chat API request / response ───────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  conversationId?: string;
  sessionId?: string;
  model?: AiModel;
  pageContext?: string;
}

export interface ChatResponse {
  conversationId: string;
  sessionId: string;
  message: IMessage;
  tokenUsage?: ITokenUsage;
}

/**
 * Events streamed over the POST /api/ai/chat response (Server-Sent
 * Events). "tool_status" fires while a tool call is in flight, "chunk"
 * delivers the final reply progressively, "done" carries the fully
 * persisted message so the client can reconcile its optimistic state,
 * and "error" reports a failure mid-stream (HTTP status is already 200
 * by the time streaming starts, so errors travel through the stream
 * itself rather than as an HTTP status code).
 */
export type ChatStreamEvent =
  | { type: "tool_status"; label: string }
  | { type: "chunk"; delta: string }
  | { type: "done"; conversationId: string; sessionId: string; message: IMessage; tokenUsage?: ITokenUsage }
  | { type: "error"; message: string };