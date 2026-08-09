"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import connectToDatabase from "@/database/connection";
import User from "@/database/models/User";
import { requireAuth, getCurrentUserOrThrow } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/admin";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { deleteCloudinaryAsset, rejectIfOversized } from "@/lib/api/cloudinary";
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

    // Server-side size enforcement — see rejectIfOversized's docstring for
    // why the client-side 5MB check in AvatarUploader alone isn't enough.
    // Only runs when a *new* avatar was actually submitted (a differing
    // avatarPublicId), not on every profile save.
    if (parsed.data.avatarPublicId && parsed.data.avatarPublicId !== currentUser.avatarPublicId) {
      const wasOversized = await rejectIfOversized(parsed.data.avatarPublicId);
      if (wasOversized) {
        return { success: false, error: "Image must be under 5MB" };
      }
    }

    // A new avatar was uploaded (avatarPublicId present in the submitted
    // values) and it replaces a previously self-uploaded one — clean up
    // the old Cloudinary asset so it doesn't linger as an orphaned file.
    // Best-effort: this never blocks the profile save itself.
    if (
      parsed.data.avatarPublicId &&
      currentUser.avatarPublicId &&
      currentUser.avatarPublicId !== parsed.data.avatarPublicId
    ) {
      await deleteCloudinaryAsset(currentUser.avatarPublicId);
    }

    const user = await User.findOneAndUpdate(
      { clerkId: currentUser.clerkId },
      {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || undefined,
        company: parsed.data.company || undefined,
        ...(parsed.data.avatarUrl
          ? { avatarUrl: parsed.data.avatarUrl, avatarPublicId: parsed.data.avatarPublicId }
          : {}),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return { success: false, error: "Account not found" };
    }

    // Keep Clerk's own copy of the avatar in sync too. MobileNav's account
    // panel (the slide-out "sidebar") renders Clerk's user.imageUrl via
    // useUser(), not this User doc — without this, a self-uploaded avatar
    // would save fine here but never appear there. Best-effort: the
    // profile save itself has already succeeded, so a Clerk hiccup here
    // shouldn't turn into a user-facing error.
    if (parsed.data.avatarUrl && parsed.data.avatarPublicId !== currentUser.avatarPublicId) {
      try {
        const imageRes = await fetch(parsed.data.avatarUrl);
        const imageBlob = await imageRes.blob();
        const client = await clerkClient();
        await client.users.updateUserProfileImage(currentUser.clerkId, { file: imageBlob });
      } catch (error) {
        logger.warn("Failed to sync avatar to Clerk", { error: String(error) });
      }
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