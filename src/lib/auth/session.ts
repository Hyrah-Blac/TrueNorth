import "server-only";
import { ROLES, isValidRole, type Role } from "@/database/constants/roles";

/**
 * Minimal shape we care about from Clerk's sessionClaims. The `metadata`
 * key only exists on the JWT if a custom session token claim has been
 * configured in the Clerk Dashboard:
 *
 *   Dashboard → Configure → Sessions → Customize session token
 *   { "metadata": "{{user.public_metadata}}" }
 *
 * Without that configuration, `metadata` is always undefined here, no
 * matter what publicMetadata.role is set to in the dashboard or via
 * clerkClient().users.updateUserMetadata(). This is the single source
 * of truth for reading the role out of those claims — middleware.ts
 * and requireAuth() both call this instead of reading sessionClaims
 * directly, so there is exactly one place that can go stale.
 */
export interface ClerkSessionClaims {
  metadata?: {
    role?: string;
  };
}

let hasWarnedMissingClaim = false;

/**
 * Narrows an unknown value down to the { metadata: { role } } shape we
 * care about, without asserting anything about the rest of the object.
 */
function readRoleClaim(sessionClaims: unknown): string | undefined {
  if (typeof sessionClaims !== "object" || sessionClaims === null) {
    return undefined;
  }

  const metadata = (sessionClaims as { metadata?: unknown }).metadata;

  if (typeof metadata !== "object" || metadata === null) {
    return undefined;
  }

  const role = (metadata as { role?: unknown }).role;
  return typeof role === "string" ? role : undefined;
}

/**
 * Resolves the app Role from Clerk sessionClaims, falling back to
 * ROLES.CUSTOMER if the claim is missing or invalid.
 *
 * Accepts `unknown` rather than a specific Clerk type on purpose: Clerk's
 * real sessionClaims type (JwtPayload & CustomJwtSessionClaims) has no
 * `metadata` property declared by default — that only exists at runtime
 * once the "metadata" custom claim is configured in the Clerk Dashboard.
 * Typing this parameter as a narrow object with only an optional
 * `metadata` field made TypeScript treat it as a "weak type" with zero
 * properties in common with Clerk's real type, which broke the build.
 * Accepting `unknown` and narrowing manually sidesteps that entirely.
 *
 * IMPORTANT: falling back to CUSTOMER here is a deliberate, safe
 * default (fail closed rather than fail open) — but it can also mask
 * a misconfigured Clerk session token, which is exactly what produced
 * the original "admin gets bounced to /dashboard" bug. To make that
 * failure mode loud instead of silent, this logs a one-time warning
 * (per server instance) whenever the claim is absent for a signed-in
 * user, so a genuinely misconfigured token surfaces in logs instead
 * of just looking like a permissions bug.
 */
export function getRoleFromSessionClaims(sessionClaims: unknown): Role {
  const claimedRole = readRoleClaim(sessionClaims);

  if (claimedRole === undefined) {
    if (!hasWarnedMissingClaim) {
      hasWarnedMissingClaim = true;
      console.warn(
        "[auth] sessionClaims.metadata.role is undefined. This usually means the " +
          '"metadata" custom claim is not configured in the Clerk Dashboard ' +
          "(Configure → Sessions → Customize session token), so every signed-in " +
          "user is silently falling back to the customer role regardless of their " +
          "actual publicMetadata.role. This warning only logs once per server instance."
      );
    }
    return ROLES.CUSTOMER;
  }

  if (!isValidRole(claimedRole)) {
    console.warn(
      `[auth] sessionClaims.metadata.role had an unrecognized value: "${claimedRole}". ` +
        "Falling back to the customer role."
    );
    return ROLES.CUSTOMER;
  }

  return claimedRole;
}