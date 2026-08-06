import "server-only";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Best-effort in-memory sliding-window rate limiter. On Vercel's
 * serverless runtime this state lives per-instance and resets on cold
 * starts, so it throttles bursts within a warm instance rather than
 * guaranteeing a hard global cap across all instances. That's an
 * acceptable tradeoff for the Vercel free plan's traffic levels; if
 * this later needs a real multi-instance guarantee, swap the Map for
 * a shared store (e.g. Upstash Redis) behind this same signature —
 * call sites won't need to change.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
}

export const RATE_LIMITS = {
  /** Public form submissions: charter requests, contact form. */
  PUBLIC_WRITE: { windowMs: 60_000, max: 5 },
  /** Public browsing: fleet listing/search. */
  PUBLIC_READ: { windowMs: 60_000, max: 60 },
  /** Signed-in reads: dashboard data, search, etc. */
  AUTHENTICATED_READ: { windowMs: 60_000, max: 120 },
  /** Signed-in mutations: profile updates, booking actions. */
  AUTHENTICATED_WRITE: { windowMs: 60_000, max: 30 },
  /**
   * AI chat completions. Tighter than AUTHENTICATED_WRITE because each
   * call incurs real per-token cost at the provider.
   * Note: this is per-instance on Vercel serverless — see module comment.
   */
  AI_CHAT: { windowMs: 60_000, max: 20 },
  /**
   * Signed Cloudinary upload credential issuance. Tighter still because
   * a credential unlocks a direct upload to our storage account.
   */
  UPLOAD_SIGNATURE: { windowMs: 60_000, max: 5 },
} as const;

export function getRequestKey(req: Request, discriminator: string): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  return `${discriminator}:${ip}`;
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Too many requests. Please try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1)),
      },
    }
  );
}