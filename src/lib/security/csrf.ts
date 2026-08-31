/**
 * Next.js Server Actions already verify the Origin header against the
 * deployment's host automatically, so this helper is only needed for
 * API routes under src/app/api that accept state-changing requests
 * directly from the browser (not webhook routes — those verify a
 * provider signature instead, which is a stronger guarantee).
 *
 * Usage in a route handler:
 *   if (!isTrustedOrigin(req)) {
 *     return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
 *   }
 */
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");

  // Same-origin requests without an Origin header (e.g. some GET
  // navigations) are allowed through; this check only guards
  // cross-origin POST/PUT/PATCH/DELETE.
  if (!origin) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (originHost === new URL(appUrl).host) return true;
    } catch {
      // NEXT_PUBLIC_APP_URL is malformed — ignore it and fall through
      // to the preview check (or the final reject) rather than
      // throwing out of a security check.
    }
  }

  // Vercel preview/branch deployments each get their own unique
  // *.vercel.app host that will never match NEXT_PUBLIC_APP_URL (that
  // var stays fixed to the real production domain). Without this,
  // every mutation — creating a booking, submitting a quote, etc. —
  // would 403 on every preview deployment, not just reject genuine
  // cross-site requests.
  //
  // VERCEL_URL is set automatically by Vercel to the exact host
  // serving the current request, and VERCEL_ENV distinguishes
  // "preview"/"development" from "production" — so this widening only
  // ever applies outside production, where NEXT_PUBLIC_APP_URL remains
  // the sole source of truth.
  // https://vercel.com/docs/environment-variables/system-environment-variables
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && originHost === vercelUrl) return true;
  }

  return false;
}

/**
 * Convenience guard for route handlers: throws-free, returns a
 * ready-to-send 403 Response when the origin is untrusted, or null
 * when the request should proceed.
 */
export function rejectUntrustedOrigin(req: Request): Response | null {
  if (isTrustedOrigin(req)) return null;

  return new Response(JSON.stringify({ error: "Invalid request origin" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}