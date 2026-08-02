export const AI_MODELS = {
  DEFAULT: "openrouter/free",
  FAST: "openrouter/free",
  CAPABLE: "openrouter/free",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export const AI_MODEL_VALUES = Object.values(AI_MODELS) as AiModel[];

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
  SEARCH_KNOWLEDGE: "search_knowledge",
  GET_COMPANY_INFO: "get_company_info",
} as const;

export type AiToolName = (typeof AI_TOOL_NAMES)[keyof typeof AI_TOOL_NAMES];
