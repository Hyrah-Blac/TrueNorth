import "server-only";
import { auth } from "@clerk/nextjs/server";
import { UnauthorizedError } from "@/lib/errors/AppError";
import { ROLES, type Role } from "@/database/constants/roles";
import connectToDatabase from "@/database/connection";
import User, { type UserDocument } from "@/database/models/User";

export interface SessionUser {
  clerkId: string;
  role: Role;
}

/**
 * Reads the Clerk session and role claim. Throws UnauthorizedError if
 * there is no signed-in user. Use this at the top of every server
 * action and API route handler that requires a signed-in user — the
 * edge middleware protects pages, but server code must re-check.
 */
export async function requireAuth(): Promise<SessionUser> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new UnauthorizedError();
  }

  const claimedRole = (sessionClaims?.metadata as { role?: Role } | undefined)?.role;
  const role: Role = claimedRole ?? ROLES.CUSTOMER;

  return { clerkId: userId, role };
}

export async function isSignedIn(): Promise<boolean> {
  const { userId } = await auth();
  return Boolean(userId);
}

/**
 * Fetches the MongoDB User document for the current Clerk session, or
 * null if not signed in / not yet synced. Prefer this whenever you
 * need profile fields (name, phone, company) rather than just the role.
 */
export async function getCurrentDbUser(): Promise<UserDocument | null> {
  const { userId } = await auth();
  if (!userId) return null;

  await connectToDatabase();
  return User.findOne({ clerkId: userId });
}

export async function getCurrentUserOrThrow(): Promise<UserDocument> {
  const user = await getCurrentDbUser();

  if (!user) {
    throw new UnauthorizedError("No matching account was found. Please sign in again.");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("This account has been deactivated. Contact support for help.");
  }

  return user;
}

/**
 * Resolves a Clerk ID to its MongoDB User _id. Use this whenever a
 * model reference field (e.g. createdBy, reviewedBy) needs the Mongo
 * ObjectId rather than the Clerk ID string from the session.
 */
export async function resolveDbUserId(clerkId: string): Promise<UserDocument["_id"]> {
  await connectToDatabase();
  const user = await User.findOne({ clerkId }).select("_id");

  if (!user) {
    throw new UnauthorizedError("No matching account was found. Please sign in again.");
  }

  return user._id;
}
