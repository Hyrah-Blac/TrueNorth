import "server-only";
import { logger } from "@/lib/logging/logger";

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  /** Optional label for log lines, e.g. "M-Pesa token fetch" */
  label?: string;
}

/**
 * Retries an async operation with exponential backoff. Safe to use on
 * idempotent calls (token fetches, status queries, email sends).
 * Do NOT wrap non-idempotent calls like STK push initiation — you
 * don't want to charge the user twice.
 *
 * Delays: attempt 1 → 0ms, attempt 2 → baseDelayMs, attempt 3 → baseDelayMs*2
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 300, label = "operation" }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        const delayMs = baseDelayMs * 2 ** i;
        logger.warn(`${label} failed, retrying`, {
          attempt: i + 1,
          totalAttempts: attempts,
          delayMs,
          error: String(err),
        });
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  logger.error(`${label} failed after all attempts`, {
    attempts,
    error: String(lastError),
  });

  throw lastError;
}