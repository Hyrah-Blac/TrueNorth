export const KNOWLEDGE_BASE_CATEGORIES = {
  CHARTER_PROCESS: "charter_process",
  AIRCRAFT_SELECTION: "aircraft_selection",
  AIRPORTS_ROUTES: "airports_routes",
  PRICING_PAYMENT: "pricing_payment",
  SAFETY_REGULATIONS: "safety_regulations",
  MEDICAL_MEDEVAC: "medical_medevac",
  SAFARI_TOURISM: "safari_tourism",
  CARGO: "cargo",
  GENERAL: "general",
} as const;

export type KnowledgeBaseCategory =
  (typeof KNOWLEDGE_BASE_CATEGORIES)[keyof typeof KNOWLEDGE_BASE_CATEGORIES];

export const KNOWLEDGE_BASE_CATEGORY_VALUES = Object.values(
  KNOWLEDGE_BASE_CATEGORIES
) as KnowledgeBaseCategory[];

export const KNOWLEDGE_BASE_CATEGORY_LABELS: Record<KnowledgeBaseCategory, string> = {
  charter_process: "Charter Process",
  aircraft_selection: "Aircraft Selection",
  airports_routes: "Airports & Routes",
  pricing_payment: "Pricing & Payment",
  safety_regulations: "Safety & Regulations",
  medical_medevac: "Medical & Medevac",
  safari_tourism: "Safari & Tourism",
  cargo: "Cargo",
  general: "General",
};

export const KNOWLEDGE_BASE_STATUSES = {
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;

export type KnowledgeBaseStatus =
  (typeof KNOWLEDGE_BASE_STATUSES)[keyof typeof KNOWLEDGE_BASE_STATUSES];

export const KNOWLEDGE_BASE_STATUS_VALUES = Object.values(
  KNOWLEDGE_BASE_STATUSES
) as KnowledgeBaseStatus[];

export const KNOWLEDGE_BASE_STATUS_LABELS: Record<KnowledgeBaseStatus, string> = {
  published: "Published",
  draft: "Draft",
};

export const KNOWLEDGE_BASE_VISIBILITIES = {
  PUBLIC: "public",
  INTERNAL: "internal",
} as const;

export type KnowledgeBaseVisibility =
  (typeof KNOWLEDGE_BASE_VISIBILITIES)[keyof typeof KNOWLEDGE_BASE_VISIBILITIES];

export const KNOWLEDGE_BASE_VISIBILITY_VALUES = Object.values(
  KNOWLEDGE_BASE_VISIBILITIES
) as KnowledgeBaseVisibility[];

export const KNOWLEDGE_BASE_VISIBILITY_LABELS: Record<KnowledgeBaseVisibility, string> = {
  public: "Public",
  internal: "Internal Only",
};
