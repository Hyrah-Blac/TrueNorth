import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { ROLES } from "@/database/constants/roles";
import { buildCspHeader } from "@/lib/security/headers";

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
  // Required: this is where Clerk's OAuth redirect lands mid-handshake,
  // *before* a session cookie exists yet. Without this, middleware sees
  // userId === null on this route and bounces the request back to
  // /sign-in via redirectToSignIn() before <AuthenticateWithRedirectCallback />
  // ever gets a chance to mount and finish establishing the session.
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
  "/api/aircraft(.*)",
  "/api/airports(.*)",
  "/api/contact",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (authFn, req) => {
  // One nonce per request, used for the Content-Security-Policy header
  // and forwarded as `x-nonce` so Server Components can stamp it on
  // inline <script> elements they render.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = buildCspHeader(nonce);

  // A stable, opaque ID for this request. Forwarded as both a request
  // header (so server actions / route handlers can include it in log
  // lines) and a response header (so client-side error reporters and
  // support tooling can correlate a user-facing failure back to a
  // specific server log entry without exposing internal detail).
  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);

  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  const respond = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", cspHeader);
    // Expose the request ID on the response so the browser (and any
    // error-tracking SDK) can record it alongside client-side errors.
    response.headers.set("X-Request-ID", requestId);
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};