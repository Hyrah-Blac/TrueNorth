"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import connectToDatabase from "@/database/connection";
import User from "@/database/models/User";
import { requireAdmin } from "@/middleware/admin";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { auditLog } from "@/lib/security/audit";
import { updateUserRoleSchema } from "../schemas/user.schema";
import type { UpdateUserRoleFormValues } from "../schemas/user.schema";
import type { ActionResult } from "../types";
import type { IUser } from "@/types/user";

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

    // An admin can't change their own role. Self-demotion is the only way
    // to remove the last admin (another admin can't demote them if they're
    // the only one), so blocking it prevents an accidental lock-out.
    const target = await User.findById(parsed.data.userId).select("clerkId");
    if (target && target.clerkId === admin.clerkId) {
      return { success: false, error: "You can't change your own role." };
    }

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

    if (!isActive) {
      const target = await User.findById(userId).select("clerkId");
      if (target && target.clerkId === admin.clerkId) {
        return { success: false, error: "You can't deactivate your own account." };
      }
    }

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // The isActive flag alone is only enforced where getCurrentUserOrThrow()
    // is called; routes that use plain requireAuth() (and a Clerk session
    // that is still valid) would otherwise keep working. Ban/unban at Clerk
    // so the block applies at sign-in too, and so a deactivated user can't
    // simply delete and recreate their Clerk account to get a fresh,
    // active record.
    try {
      const client = await clerkClient();
      if (isActive) {
        await client.users.unbanUser(user.clerkId);
      } else {
        await client.users.banUser(user.clerkId);
      }
    } catch (clerkError) {
      logger.error("toggleUserActive: Clerk ban/unban failed", {
        error: String(clerkError),
        targetClerkId: user.clerkId,
        isActive,
      });
      return {
        success: false,
        error: isActive
          ? "The account was reactivated in the app, but unblocking sign-in at Clerk failed. Please try again."
          : "The account was marked inactive in the app, but blocking sign-in at Clerk failed. Please try again.",
      };
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