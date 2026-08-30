import "server-only";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { logger } from "@/lib/logging/logger";

/**
 * FIX 7 — encrypts the raw ticket verification token at rest.
 *
 * Ticket.verificationToken is a bearer credential (see Ticket.ts):
 * anyone who has it can view/verify that ticket. It has to be stored
 * in a form the app can read back (to redisplay a QR code), so unlike
 * a password it can't just be hashed — but it also shouldn't sit in
 * the database as plaintext.
 *
 * Scope, deliberately kept small:
 *  - AES-256-GCM via Node's built-in `crypto` — no new dependency.
 *  - A single symmetric key from TICKET_TOKEN_ENCRYPTION_KEY (32
 *    bytes, base64-encoded). One key, no rotation/versioning scheme
 *    beyond the format tag below — a full key-management/rotation
 *    system was judged out of scope for this fix (see the change
 *    report's Deferred section for the rotation follow-up).
 *  - Backward compatible by construction: encryptToken/decryptToken
 *    tag their output with a fixed "v1:" prefix. decryptToken treats
 *    any value WITHOUT that prefix as an already-existing plaintext
 *    token (i.e. one issued before this fix) and returns it unchanged
 *    — so tickets issued before TICKET_TOKEN_ENCRYPTION_KEY existed
 *    keep working with no migration required.
 *
 * HARDENING — production behavior when the key is missing:
 *  - In production (NODE_ENV === "production"), encryptToken() now
 *    THROWS instead of silently falling back to storing the token in
 *    plaintext. A production deployment with no configured encryption
 *    key must not be allowed to quietly persist bearer credentials
 *    unencrypted — that's exactly the failure mode this fix exists to
 *    close, and it should be loud and immediate (a clear
 *    configuration error) rather than something that only shows up
 *    later as "why are these tokens in plaintext".
 *  - Outside production (development/test), the previous
 *    fail-open-to-plaintext-with-a-warning behavior is preserved, so
 *    a developer can run the app locally without first generating and
 *    configuring a real encryption key — matching the project's
 *    existing convention of not hard-requiring every production
 *    secret in non-production environments (see
 *    lib/config/env.ts, database/connection.ts).
 *  - The thrown error's message never includes the token value itself
 *    — only the fact that encryption is required and unavailable —
 *    and none of this file's logging ever writes an actual token
 *    (plaintext or otherwise) to the logs, in either environment.
 *  - This only changes what happens when a NEW token is being
 *    encrypted for storage (issueTicketForBooking.ts). It does not
 *    touch decryptToken()'s backward-compatibility behavior for
 *    tokens that were already stored as plaintext before this key was
 *    configured — those still decrypt (i.e. pass through unchanged)
 *    exactly as before, in every environment.
 */
const ENCRYPTED_PREFIX = "v1:";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getKey(): Buffer | null {
  const raw = process.env.TICKET_TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;

  try {
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
      logger.error("TICKET_TOKEN_ENCRYPTION_KEY is set but is not 32 bytes once base64-decoded — ignoring it", {
        decodedLength: key.length,
      });
      return null;
    }
    return key;
  } catch {
    logger.error("TICKET_TOKEN_ENCRYPTION_KEY is not valid base64 — ignoring it");
    return null;
  }
}

let warnedMissingKeyOnce = false;

/**
 * Encrypts a raw token for storage.
 *
 * Throws in production if no valid key is configured (see module doc)
 * — callers (issueTicketForBooking.ts) already isolate ticket
 * issuance in its own try/catch, so this failing does not affect the
 * payment/booking-credit flow it's called from; it only prevents a
 * new ticket's token from ever being persisted as plaintext.
 *
 * Outside production, fails open to plaintext with a one-time warning
 * (developer convenience — see module doc).
 */
export function encryptToken(plainToken: string): string {
  const key = getKey();
  if (!key) {
    if (isProduction()) {
      throw new Error(
        "TICKET_TOKEN_ENCRYPTION_KEY is not configured (or is invalid). Refusing to store a new ticket verification token in plaintext in production. Set a 32-byte, base64-encoded key for this environment variable."
      );
    }

    if (!warnedMissingKeyOnce) {
      warnedMissingKeyOnce = true;
      logger.warn(
        "TICKET_TOKEN_ENCRYPTION_KEY is not configured — ticket verification tokens will be stored in plaintext in this (non-production) environment. Set this env var to enable at-rest encryption (see tokenCipher.ts)."
      );
    }
    return plainToken;
  }

  const iv = randomBytes(12); // 96-bit IV, the recommended size for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [ENCRYPTED_PREFIX, iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ":"
  );
}

/**
 * Decrypts a stored token back to its raw form. Values without the
 * "v1:" prefix are assumed to be pre-existing plaintext tokens (see
 * module doc) and are returned as-is — this is what makes the
 * feature safely deployable without a data migration.
 */
export function decryptToken(stored: string): string {
  if (!stored.startsWith(ENCRYPTED_PREFIX)) {
    return stored;
  }

  const key = getKey();
  if (!key) {
    // The value is encrypted but we have no key to decrypt it with —
    // this means the env var was removed/changed after some tokens
    // were already encrypted with it. Fail loudly rather than
    // returning garbage that would silently break QR codes/verification
    // links.
    throw new Error(
      "Cannot decrypt ticket verification token: TICKET_TOKEN_ENCRYPTION_KEY is not configured or invalid"
    );
  }

  const [, ivB64, authTagB64, ciphertextB64] = stored.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
