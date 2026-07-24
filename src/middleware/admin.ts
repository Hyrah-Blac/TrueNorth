import "server-only";
import { ForbiddenError } from "@/lib/errors/AppError";
import { ROLES } from "@/database/constants/roles";
import { requireAuth, type SessionUser } from "./auth";

/**
 * Throws ForbiddenError unless the signed-in user has the admin role.
 * Call this at the top of every admin server action and API route —
 * do not rely on the edge middleware's /admin(.*) check alone.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();

  if (session.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Administrator access is required for this action");
  }

  return session;
}

export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
