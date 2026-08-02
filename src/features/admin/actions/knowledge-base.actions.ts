"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import KnowledgeBase from "@/database/models/KnowledgeBase";
import { requireAdmin } from "@/middleware/admin";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import {
  createKnowledgeBaseSchema,
  updateKnowledgeBaseSchema,
  type CreateKnowledgeBaseInput,
  type UpdateKnowledgeBaseInput,
} from "@/features/knowledge-base/schemas/knowledge-base.schema";
import type { IKnowledgeBase } from "@/types/knowledge-base";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function createKnowledgeBaseEntry(
  input: CreateKnowledgeBaseInput
): Promise<ActionResult<IKnowledgeBase>> {
  try {
    await requireAdmin();
    const data = createKnowledgeBaseSchema.parse(input);

    await connectToDatabase();

    const entry = await KnowledgeBase.create({
      ...data,
     lastReviewedAt: data.lastReviewedAt ? new Date(data.lastReviewedAt) : undefined,
    });

    revalidatePath("/admin/knowledge-base");

    return { success: true, data: serialize<IKnowledgeBase>(entry) };
  } catch (error) {
    logger.error("createKnowledgeBaseEntry failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to create entry" };
  }
}

export async function updateKnowledgeBaseEntry(
  entryId: string,
  input: UpdateKnowledgeBaseInput
): Promise<ActionResult<IKnowledgeBase>> {
  try {
    await requireAdmin();
    const data = updateKnowledgeBaseSchema.parse(input);

    await connectToDatabase();

    const entry = await KnowledgeBase.findById(entryId);
    if (!entry) return { success: false, error: "Entry not found" };

    Object.assign(entry, {
      ...data,
      lastReviewedAt: data.lastReviewedAt ? new Date(data.lastReviewedAt) : entry.lastReviewedAt,
    });
    await entry.save();

    revalidatePath("/admin/knowledge-base");

    return { success: true, data: serialize<IKnowledgeBase>(entry) };
  } catch (error) {
    logger.error("updateKnowledgeBaseEntry failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update entry" };
  }
}

export async function deleteKnowledgeBaseEntry(
  entryId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    await connectToDatabase();

    const entry = await KnowledgeBase.findByIdAndDelete(entryId);
    if (!entry) return { success: false, error: "Entry not found" };

    revalidatePath("/admin/knowledge-base");

    return { success: true, data: { id: String(entry._id) } };
  } catch (error) {
    logger.error("deleteKnowledgeBaseEntry failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to delete entry" };
  }
}

export async function publishKnowledgeBaseEntry(
  entryId: string
): Promise<ActionResult<IKnowledgeBase>> {
  try {
    await requireAdmin();
    await connectToDatabase();

    const entry = await KnowledgeBase.findById(entryId);
    if (!entry) return { success: false, error: "Entry not found" };

    entry.status = "published";
    entry.lastReviewedAt = new Date();
    await entry.save();

    revalidatePath("/admin/knowledge-base");

    return { success: true, data: serialize<IKnowledgeBase>(entry) };
  } catch (error) {
    logger.error("publishKnowledgeBaseEntry failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to publish entry" };
  }
}

export async function unpublishKnowledgeBaseEntry(
  entryId: string
): Promise<ActionResult<IKnowledgeBase>> {
  try {
    await requireAdmin();
    await connectToDatabase();

    const entry = await KnowledgeBase.findById(entryId);
    if (!entry) return { success: false, error: "Entry not found" };

    entry.status = "draft";
    await entry.save();

    revalidatePath("/admin/knowledge-base");

    return { success: true, data: serialize<IKnowledgeBase>(entry) };
  } catch (error) {
    logger.error("unpublishKnowledgeBaseEntry failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to unpublish entry" };
  }
}

export interface KnowledgeBaseListResult {
  entries: IKnowledgeBase[];
  total: number;
  totalPages: number;
  page: number;
}

export async function getKnowledgeBaseForAdmin(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  visibility?: string;
} = {}): Promise<KnowledgeBaseListResult> {
  await requireAdmin();
  await connectToDatabase();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (params.category && params.category !== "all") filter.category = params.category;
  if (params.status && params.status !== "all") filter.status = params.status;
  if (params.visibility && params.visibility !== "all") filter.visibility = params.visibility;
  if (params.search) filter.$text = { $search: params.search };

  const [items, total] = await Promise.all([
    KnowledgeBase.find(filter)
      .sort({ priority: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    KnowledgeBase.countDocuments(filter),
  ]);

  return {
    entries: serialize<IKnowledgeBase[]>(items),
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    page,
  };
}

export async function getKnowledgeBaseEntryById(id: string): Promise<IKnowledgeBase | null> {
  await requireAdmin();
  await connectToDatabase();

  const entry = await KnowledgeBase.findById(id);
  if (!entry) return null;
  return serialize<IKnowledgeBase>(entry);
}
