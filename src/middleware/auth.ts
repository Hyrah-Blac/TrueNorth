import "server-only";
import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { UnauthorizedError } from "@/lib/errors/AppError";
import { type Role } from "@/database/constants/roles";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
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

  const role = getRoleFromSessionClaims(sessionClaims);

  return { clerkId: userId, role };
}

export async function isSignedIn(): Promise<boolean> {
  const { userId } = await auth();
  return Boolean(userId);
}

/**
 * Creates the Mongo User doc for a Clerk account that doesn't have one
 * yet, pulling the details straight from Clerk's backend API. This is
 * the same shape as the `user.created` webhook handler, and matches by
 * clerkId OR email for the same reason (avoid E11000 collisions with a
 * pre-existing record under the same email).
 *
 * Exists to close a race condition: setActive() makes a session live
 * immediately on sign-up, but the `user.created` webhook that creates
 * the Mongo record is a separate async call from Clerk — it can easily
 * arrive after the client has already redirected to a page that needs
 * the User doc. This self-heals instead of throwing in that window.
 */
async function syncUserFromClerk(clerkId: string): Promise<UserDocument> {
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(clerkId);

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;

  if (!primaryEmail) {
    throw new UnauthorizedError("Your account is missing a verified email address.");
  }

  await connectToDatabase();

  const query = { $or: [{ clerkId }, { email: primaryEmail }] };
  const update = {
    clerkId,
    email: primaryEmail,
    firstName: clerkUser.firstName || "Customer",
    lastName: clerkUser.lastName || "",
    avatarUrl: clerkUser.imageUrl,
    role: "customer" as Role,
    isActive: true,
  };

  try {
    const user = await User.findOneAndUpdate(query, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    return user;
  } catch (error) {
    // The webhook and this self-heal path (or multiple concurrent
    // Server Components each calling getCurrentDbUser on the same
    // request) can race to create the same document at once. Mongo's
    // unique index correctly rejects the loser with E11000 — that's
    // not a real failure, it just means another caller already won
    // the race and created the record we wanted. Fetch it instead of
    // giving up.
    const isDuplicateKeyError =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;

    if (isDuplicateKeyError) {
      const existing = await User.findOne(query);
      if (existing) return existing;
    }

    throw error;
  }
}

/**
 * Fetches the MongoDB User document for the current Clerk session, or
 * null if not signed in. Prefer this whenever you need profile fields
 * (name, phone, company) rather than just the role.
 *
 * If the webhook hasn't synced this account to Mongo yet (e.g. right
 * after sign-up), this falls back to creating it on the spot from
 * Clerk's own data rather than returning null.
 *
 * Wrapped in React's cache() so multiple Server Components (layout,
 * page, nested data loaders) calling this during the same request
 * share one lookup instead of each independently racing to sync —
 * this doesn't help across separate requests (webhook vs. page load),
 * but it removes the biggest source of same-request collisions.
 */
export const getCurrentDbUser = cache(async (): Promise<UserDocument | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  await connectToDatabase();
  const existing = await User.findOne({ clerkId: userId });
  if (existing) return existing;

  try {
    return await syncUserFromClerk(userId);
  } catch (error) {
    // If the self-heal itself fails for a reason other than the race
    // handled above (e.g. a genuine Clerk API hiccup), fall back to the
    // original "not found" behavior rather than throwing a different,
    // more confusing error from here.
    console.error("Failed to self-heal missing User doc", { clerkId: userId, error });
    return null;
  }
});

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