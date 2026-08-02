import { Schema, model, models, type Model, type Document } from "mongoose";
import { slugPlugin } from "../plugins/slug";
import {
  KNOWLEDGE_BASE_CATEGORY_VALUES,
  KNOWLEDGE_BASE_STATUS_VALUES,
  KNOWLEDGE_BASE_STATUSES,
  KNOWLEDGE_BASE_VISIBILITY_VALUES,
  KNOWLEDGE_BASE_VISIBILITIES,
  type KnowledgeBaseCategory,
  type KnowledgeBaseStatus,
  type KnowledgeBaseVisibility,
} from "../constants/knowledge-base";

export type { KnowledgeBaseCategory, KnowledgeBaseStatus, KnowledgeBaseVisibility };

export interface KnowledgeBaseDocument extends Document {
  title: string;
  slug: string;
  category: KnowledgeBaseCategory;
  content: string;
  keywords: string[];
  visibility: KnowledgeBaseVisibility;
  priority: number;
  isFeatured: boolean;
  status: KnowledgeBaseStatus;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema = new Schema<KnowledgeBaseDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    slug: { type: String },
    category: {
      type: String,
      enum: KNOWLEDGE_BASE_CATEGORY_VALUES,
      required: [true, "Category is required"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: 20000,
    },
    keywords: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 30,
        message: "Maximum 30 keywords",
      },
    },
    visibility: {
      type: String,
      enum: KNOWLEDGE_BASE_VISIBILITY_VALUES,
      default: KNOWLEDGE_BASE_VISIBILITIES.PUBLIC,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: KNOWLEDGE_BASE_STATUS_VALUES,
      default: KNOWLEDGE_BASE_STATUSES.DRAFT,
      index: true,
    },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
);

KnowledgeBaseSchema.plugin(slugPlugin, { source: "title" });

KnowledgeBaseSchema.index({ category: 1, status: 1, visibility: 1 });
KnowledgeBaseSchema.index({ priority: -1, createdAt: -1 });
KnowledgeBaseSchema.index({ title: "text", content: "text", keywords: "text" });

export const KnowledgeBase: Model<KnowledgeBaseDocument> =
  models.KnowledgeBase || model<KnowledgeBaseDocument>("KnowledgeBase", KnowledgeBaseSchema);

export default KnowledgeBase;
