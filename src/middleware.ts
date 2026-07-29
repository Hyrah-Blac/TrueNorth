import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { ROLES } from "@/database/constants/roles";
import { buildCspHeader } from "@/lib/security/headers";

// Everything NOT listed here requires sign-in by default once it hits
// a protected matcher below. Keep this list in sync with the (public)
// route group as new public pages are added.
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/contact",
  "/destinations(.*)",
  "/fleet(.*)",
  "/request-charter",
  "/robots.txt",
  "/sitemap.xml",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Required: this is where Clerk's OAuth redirect lands mid-handshake,
  // *before* a session cookie exists yet. Without this, middleware sees
  // userId === null on this route and bounces the request back to
  // /sign-in via redirectToSignIn() before <AuthenticateWithRedirectCallback />
  // ever gets a chance to mount and finish establishing the session —
  // this was the actual cause of Google sign-in "bouncing back" to /sign-in.
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
  "/api/aircraft(.*)",
  "/api/contact",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (authFn, req) => {
  // One nonce per request. It's threaded two ways: as the nonce inside
  // the Content-Security-Policy response header (what the browser
  // actually enforces), and as an `x-nonce` request header so Server
  // Components downstream can read it via `headers()` and stamp it on
  // any inline <script> they render — see src/components/shared/JsonLd.tsx.
  // Next.js picks this same nonce up automatically for its own inline
  // bootstrap/hydration scripts once it sees it in the CSP header, no
  // extra wiring needed for those.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = buildCspHeader(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  const respond = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  };

  if (isPublicRoute(req)) {
    return respond(next());
  }

  const { userId, sessionClaims, redirectToSignIn } = await authFn();

  if (!userId) {
    return respond(redirectToSignIn({ returnBackUrl: req.url }));
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (isAdminRoute(req) && role !== ROLES.ADMIN) {
    return respond(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  return respond(next());
});

export const config = {
  matcher: [
    // Skip static assets and Next internals, always run on API/tRPC routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};