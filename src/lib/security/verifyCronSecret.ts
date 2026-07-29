import "server-only";
import { timingSafeEqual } from "crypto";

/**
 * Verifies the Authorization header on cron routes against
 * CRON_SECRET using a constant-time comparison. A plain `!==` string
 * check leaks timing information proportional to how many leading
 * characters match, which (in theory) helps an attacker brute-force
 * the secret byte-by-byte. timingSafeEqual removes that signal.
 *
 * Returns false (never throws) for any malformed input — missing
 * header, missing env var, or a length mismatch — so callers can
 * treat every failure mode identically as "unauthorized".
 */
export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);

  // timingSafeEqual throws on mismatched buffer lengths rather than
  // returning false, so that case has to be checked explicitly first.
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}