import { z } from "zod";
import {
  KNOWLEDGE_BASE_CATEGORY_VALUES,
  KNOWLEDGE_BASE_STATUS_VALUES,
  KNOWLEDGE_BASE_VISIBILITY_VALUES,
  type KnowledgeBaseCategory,
  type KnowledgeBaseStatus,
  type KnowledgeBaseVisibility,
} from "@/database/constants/knowledge-base";

const categoryEnum = z.enum(
  KNOWLEDGE_BASE_CATEGORY_VALUES as [KnowledgeBaseCategory, ...KnowledgeBaseCategory[]]
);
const statusEnum = z.enum(
  KNOWLEDGE_BASE_STATUS_VALUES as [KnowledgeBaseStatus, ...KnowledgeBaseStatus[]]
);
const visibilityEnum = z.enum(
  KNOWLEDGE_BASE_VISIBILITY_VALUES as [KnowledgeBaseVisibility, ...KnowledgeBaseVisibility[]]
);

export const createKnowledgeBaseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  category: categoryEnum,
  content: z.string().trim().min(10, "Content must be at least 10 characters").max(20000),
  keywords: z.array(z.string().trim().max(80)).max(30).default([]),
  visibility: visibilityEnum.default("public"),
  priority: z.number().int().min(0).max(100).default(0),
  isFeatured: z.boolean().default(false),
  status: statusEnum.default("draft"),
  lastReviewedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional()
    .or(z.literal("")),
});

export const updateKnowledgeBaseSchema = createKnowledgeBaseSchema.partial();

export type CreateKnowledgeBaseInput = z.infer<typeof createKnowledgeBaseSchema>;
export type UpdateKnowledgeBaseInput = z.infer<typeof updateKnowledgeBaseSchema>;

export const knowledgeBaseQuerySchema = z.object({
  category: categoryEnum.optional(),
  status: statusEnum.optional(),
  visibility: visibilityEnum.optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type KnowledgeBaseQuery = z.infer<typeof knowledgeBaseQuerySchema>;