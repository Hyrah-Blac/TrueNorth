import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { ROLES } from "@/database/constants/roles";
import { buildCspHeader } from "@/lib/security/headers";
import { rejectUntrustedOrigin } from "@/lib/security/csrf";

// Routes that bypass maintenance mode entirely — no auth check needed,
// just infrastructure that must always work:
//  - /maintenance itself (avoids infinite rewrite loop)
//  - /api/system/maintenance-status (the check that drives this logic)
//  - /sign-in, /sign-up, /sso-callback (admins need to be able to log in
//    during maintenance to flip the toggle back off)
//  - /api/health — uptime monitors see the real DB status
//  - /api/webhooks — payment / Clerk retries must not be silently dropped
//
// NOTE: /admin is intentionally NOT listed here. Admins are allowed
// through during maintenance, but that check happens after we verify
// their session claims below — not by blindly exempting the URL pattern
// (which would let any unauthenticated visitor bypass maintenance just
// by visiting /admin).
const isMaintenanceExemptRoute = createRouteMatcher([
  "/maintenance",
  "/api/system/maintenance-status",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/health",
  "/api/webhooks(.*)",
]);

async function isMaintenanceModeOn(
  req: Parameters<typeof isMaintenanceExemptRoute>[0]
): Promise<{ enabled: boolean; message: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      new URL("/api/system/maintenance-status", req.url),
      {
        signal: controller.signal,
        headers: { "x-middleware-internal": "1" },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return { enabled: false, message: null };
    const data = (await res.json()) as {
      enabled: boolean;
      message: string | null;
    };
    return data;
  } catch {
    return { enabled: false, message: null };
  }
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/contact",
  "/destinations(.*)",
  "/fleet(.*)",
  "/request-charter",
  "/robots.txt",
  "/api/health",
  "/sitemap.xml",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
  "/api/aircraft(.*)",
  "/api/airports(.*)",
  "/api/ai/chat",
  "/api/system/maintenance-status",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Webhook routes are exempt from the CSRF origin check below — they're
// server-to-server calls authenticated by a provider signature (svix,
// Paystack's HMAC, M-Pesa's independent re-verification), never by the
// browser session cookie this check exists to protect, and they
// typically carry no Origin header at all.
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);

const CSRF_GUARDED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default clerkMiddleware(async (authFn, req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = buildCspHeader(nonce);
  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);

  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  const respond = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("X-Request-ID", requestId);
    return response;
  };

  // CSRF gate — every state-changing request to our own API must come
  // from our own origin (or carry no Origin header at all, e.g. a
  // same-origin navigation). This is the enforcement point for
  // src/lib/security/csrf.ts's isTrustedOrigin/rejectUntrustedOrigin,
  // which existed as a helper but was never actually called anywhere —
  // every mutating API route was relying solely on the Clerk session
  // cookie for auth, with no origin check backing it up. Centralizing
  // it here (rather than adding a call to all 20+ route handlers)
  // means it can't be forgotten on a new route going forward.
  if (
    req.nextUrl.pathname.startsWith("/api/") &&
    !isWebhookRoute(req) &&
    CSRF_GUARDED_METHODS.has(req.method)
  ) {
    const csrfRejection = rejectUntrustedOrigin(req);
    if (csrfRejection) return csrfRejection;
  }

  // Maintenance gate — runs for every route that isn't in the exempt list
  if (!isMaintenanceExemptRoute(req)) {
    const { enabled } = await isMaintenanceModeOn(req);

    if (enabled) {
      // Peek at session claims without triggering a full auth() call —
      // auth() is lazy in Clerk middleware and won't block if we only
      // read the already-decoded JWT. Admins pass straight through;
      // everyone else (including unauthenticated visitors) sees /maintenance.
      const { sessionClaims } = await authFn();
      const role = getRoleFromSessionClaims(sessionClaims);

      if (role !== ROLES.ADMIN) {
        const maintenanceUrl = new URL("/maintenance", req.url);
        const rewritten = NextResponse.rewrite(maintenanceUrl, { status: 503 });
        rewritten.headers.set("Retry-After", "3600");
        return respond(rewritten);
      }

      // Admin — fall through to normal routing below
    }
  }

  if (isPublicRoute(req)) {
    return respond(next());
  }

  const { userId, sessionClaims, redirectToSignIn } = await authFn();

  if (!userId) {
    return respond(redirectToSignIn({ returnBackUrl: req.url }));
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (isAdminRoute(req) && role !== ROLES.ADMIN) {
    return respond(NextResponse.redirect(new URL("/dashboard/bookings", req.url)));
  }

  return respond(next());
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};