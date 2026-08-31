import "server-only";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Storage abstraction behind the rate limiter (FIX 6). The limiter
 * logic in checkRateLimit only talks to this interface — it has no
 * idea the current implementation happens to be an in-memory Map.
 * Swapping to a distributed store later (e.g. Upstash Redis, for a
 * real cross-instance guarantee on Vercel's serverless runtime) means
 * writing one new class that implements this interface and changing
 * the single `store` assignment below — no call site anywhere else in
 * the app needs to change. This is intentionally NOT a bigger refactor
 * than that: no new dependency is introduced here, and the in-memory
 * behavior/limits are unchanged.
 */
export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  get size(): number;
  entries(): IterableIterator<[string, RateLimitEntry]>;
  delete(key: string): void;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly map = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    return this.map.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.map.set(key, entry);
  }

  get size(): number {
    return this.map.size;
  }

  entries(): IterableIterator<[string, RateLimitEntry]> {
    return this.map.entries();
  }

  delete(key: string): void {
    this.map.delete(key);
  }
}

const store: RateLimitStore = new InMemoryRateLimitStore();

// Once the store grows past this size, the next check() opportunistically
// sweeps out expired entries before continuing. Keeps the store bounded on
// a long-lived warm instance without doing O(n) work on every request.
const SWEEP_THRESHOLD = 5_000;

function sweepExpired(now: number): void {
  if (store.size < SWEEP_THRESHOLD) return;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

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
  sweepExpired(now);
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
  /**
   * Customer quote/booking/payment detail pages. These now show a
   * different screen for "belongs to another account" vs. "doesn't
   * exist" (see WrongAccountNotice) so someone can no longer look up a
   * resource with real content — but the two screens ARE distinguishable
   * from each other, which lets a signed-in account confirm whether a
   * guessed id is real. IDs are non-sequential Mongo ObjectIds, so this
   * isn't practically guessable, but this tier caps the guessing rate
   * anyway as a defense-in-depth measure. Well above any legitimate
   * usage pattern (a customer browsing their own handful of records).
   */
  DETAIL_PAGE_LOOKUP: { windowMs: 60_000, max: 20 },
} as const;

/**
 * Rate-limit key scoped to the requester's IP alone. Use this (rather
 * than embedding a user/account id into the discriminator, as some
 * older call sites did) when the goal is a true per-IP limit —
 * e.g. alongside a separate checkUserRateLimit call, so a single
 * account can't dodge its own limit across many IPs/devices AND a
 * single IP can't dodge its limit across many accounts. See
 * app/api/upload/documents/route.ts for the combined usage (FIX 5).
 */
export function getRequestKey(req: Request, discriminator: string): string {
  // See src/app/api/webhooks/mpesa/route.ts's getCallerIp for the full
  // reasoning: x-forwarded-for's leftmost entry is whatever the caller
  // claims (fully attacker-controlled), while the rightmost entry is
  // what our own edge actually observed. Reading [0] let anyone dodge
  // this rate limit for free by sending a fresh fake IP on every
  // request. Lower stakes here than the webhook allowlist (worst case
  // is a rate limit getting evaded, not a forged payment), but the
  // same fix applies.
  const forwardedFor = req.headers.get("x-forwarded-for");
  const hops = forwardedFor?.split(",").map((ip) => ip.trim()).filter(Boolean) ?? [];
  const ip = hops.length > 0 ? hops[hops.length - 1] : "unknown";
  return `${discriminator}:${ip}`;
}

/**
 * Rate-limit key scoped to the signed-in user rather than IP. Used for
 * authenticated Server Component pages, which don't have a `Request`
 * object to read headers from the way route handlers do — but do have
 * a stable identity (the Clerk user id) that's actually the right thing
 * to key on here: the concern is one account probing many ids, not one
 * IP address doing so.
 */
export function checkUserRateLimit(userClerkId: string, discriminator: string, config: RateLimitConfig): RateLimitResult {
  return checkRateLimit(`${discriminator}:${userClerkId}`, config);
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