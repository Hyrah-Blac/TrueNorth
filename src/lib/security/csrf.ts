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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Same-origin requests without an Origin header (e.g. some GET
  // navigations) are allowed through; this check only guards
  // cross-origin POST/PUT/PATCH/DELETE.
  if (!origin) return true;
  if (!appUrl) return false;

  try {
    return new URL(origin).host === new URL(appUrl).host;
  } catch {
    return false;
  }
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

