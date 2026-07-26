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
 * Resolves the app Role from Clerk sessionClaims, falling back to
 * ROLES.CUSTOMER if the claim is missing or invalid.
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
export function getRoleFromSessionClaims(sessionClaims: ClerkSessionClaims | null | undefined): Role {
  const claimedRole = sessionClaims?.metadata?.role;

  // TEMPORARY DEBUG LOG — remove once the missing-claim issue is confirmed
  // fixed. Prints the raw sessionClaims object so we can see exactly what
  // Clerk is sending (or not sending) at runtime.
  console.log("[auth debug] sessionClaims:", JSON.stringify(sessionClaims));

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