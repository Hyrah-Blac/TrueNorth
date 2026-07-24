"use server";

import { requireAdmin } from "@/middleware/admin";
import { deleteCloudinaryAsset } from "@/lib/api/cloudinary";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

type ActionResult = { success: true } | { success: false; error: string };

export async function deleteUploadedAsset(publicId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteCloudinaryAsset(publicId);
    return { success: true };
  } catch (error) {
    logger.error("deleteUploadedAsset failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to delete image" };
  }
}
