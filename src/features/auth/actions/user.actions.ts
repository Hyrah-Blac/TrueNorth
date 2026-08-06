"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import connectToDatabase from "@/database/connection";
import User from "@/database/models/User";
import { requireAuth, getCurrentUserOrThrow } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/admin";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { auditLog } from "@/lib/security/audit";
import { updateProfileSchema, updateUserRoleSchema } from "../schemas/user.schema";
import type { UpdateProfileFormValues, UpdateUserRoleFormValues } from "../schemas/user.schema";
import type { ActionResult } from "../types";
import type { IUser } from "@/types/user";

export async function getCurrentUserProfile(): Promise<ActionResult<IUser>> {
  try {
    await requireAuth();
    const user = await getCurrentUserOrThrow();
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    const message = isAppError(error) ? error.message : "Failed to load profile";
    return { success: false, error: message };
  }
}

export async function updateOwnProfile(
  values: UpdateProfileFormValues
): Promise<ActionResult<IUser>> {
  try {
    const currentUser = await getCurrentUserOrThrow();
    const parsed = updateProfileSchema.safeParse(values);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { clerkId: currentUser.clerkId },
      {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || undefined,
        company: parsed.data.company || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return { success: false, error: "Account not found" };
    }

    revalidatePath("/dashboard/profile");
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    logger.error("updateOwnProfile failed", { error: String(error) });
    const message = isAppError(error) ? error.message : "Failed to update profile";
    return { success: false, error: message };
  }
}

/**
 * Admin-only. Updates the role in both MongoDB (source of truth for
 * queries/UI) and Clerk publicMetadata (source of truth for the edge
 * middleware's session claim). Both must stay in sync.
 */
export async function updateUserRole(
  values: UpdateUserRoleFormValues
): Promise<ActionResult<IUser>> {
  try {
    const admin = await requireAdmin();
    const parsed = updateUserRoleSchema.safeParse(values);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      parsed.data.userId,
      { role: parsed.data.role },
      { new: true }
    );

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role: parsed.data.role },
    });

    auditLog({
      action: "user.role_change",
      actorClerkId: admin.clerkId,
      resourceId: String(user._id),
      resourceType: "user",
      meta: { newRole: parsed.data.role, targetClerkId: user.clerkId },
    });

    revalidatePath("/admin/customers");
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    logger.error("updateUserRole failed", { error: String(error) });
    const message = isAppError(error) ? error.message : "Failed to update user role";
    return { success: false, error: message };
  }
}

/**
 * Admin-only. Deactivating does not delete the account or its history
 * (bookings/quotes/payments stay intact) — it only blocks the
 * deactivated user from further sign-in-gated actions, enforced by
 * getCurrentUserOrThrow()'s isActive check.
 */
export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<ActionResult<IUser>> {
  try {
    const admin = await requireAdmin();
    await connectToDatabase();

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    auditLog({
      action: isActive ? "user.activate" : "user.deactivate",
      actorClerkId: admin.clerkId,
      resourceId: userId,
      resourceType: "user",
      meta: { targetClerkId: user.clerkId },
    });

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${userId}`);
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    logger.error("toggleUserActive failed", { error: String(error) });
    const message = isAppError(error) ? error.message : "Failed to update account status";
    return { success: false, error: message };
  }
}