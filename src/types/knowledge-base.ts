import type {
  KnowledgeBaseCategory,
  KnowledgeBaseStatus,
  KnowledgeBaseVisibility,
} from "@/database/constants/knowledge-base";

export type { KnowledgeBaseCategory, KnowledgeBaseStatus, KnowledgeBaseVisibility };

export interface IKnowledgeBase {
  _id: string;
  title: string;
  slug: string;
  category: KnowledgeBaseCategory;
  content: string;
  keywords: string[];
  visibility: KnowledgeBaseVisibility;
  priority: number;
  isFeatured: boolean;
  status: KnowledgeBaseStatus;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseFilters {
  category?: KnowledgeBaseCategory;
  status?: KnowledgeBaseStatus;
  visibility?: KnowledgeBaseVisibility;
  search?: string;
  page?: number;
  limit?: number;
}
