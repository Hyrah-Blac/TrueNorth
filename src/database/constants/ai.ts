// AI_MODELS is intentionally NOT a closed enum of allowed values.
// The actual model used at runtime comes from the GEMINI_MODEL env var
// (read in src/lib/ai/client.ts via getEnv()). These constants are
// convenience labels used inside the app to reference model tiers without
// repeating raw strings — they must stay in sync with GEMINI_MODEL in
// your .env. The schema validation for the optional client-supplied
// `model` override in POST /api/ai/chat accepts any non-empty string
// rather than a closed enum, so changing GEMINI_MODEL never requires a
// code change here.
export const AI_MODELS = {
  DEFAULT: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  FAST: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  CAPABLE: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
} as const;

// AiModel is a string alias — not a closed union — so downstream code
// that stores or compares a model name works regardless of which model
// is configured in env.
export type AiModel = string;

// Kept for API compatibility with code that imports AI_MODEL_VALUES,
// but no longer used as a Zod enum (see chat.schema.ts).
export const AI_MODEL_VALUES: string[] = Object.values(AI_MODELS);

export const CONVERSATION_STATUSES = {
  ACTIVE: "active",
  ENDED: "ended",
  ARCHIVED: "archived",
} as const;

export type ConversationStatus =
  (typeof CONVERSATION_STATUSES)[keyof typeof CONVERSATION_STATUSES];

export const CONVERSATION_STATUS_VALUES = Object.values(
  CONVERSATION_STATUSES
) as ConversationStatus[];

export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

export type MessageRole = (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];

export const MESSAGE_ROLE_VALUES = Object.values(MESSAGE_ROLES) as MessageRole[];

export const AI_TOOL_NAMES = {
  SEARCH_AIRCRAFT: "search_aircraft",
  LOOKUP_AIRPORT: "lookup_airport",
  FIND_NEARBY_AIRPORTS: "find_nearby_airports",
  SEARCH_KNOWLEDGE: "search_knowledge",
  GET_COMPANY_INFO: "get_company_info",
  SUBMIT_QUOTE_REQUEST: "submit_quote_request",
} as const;

export type AiToolName = (typeof AI_TOOL_NAMES)[keyof typeof AI_TOOL_NAMES];
