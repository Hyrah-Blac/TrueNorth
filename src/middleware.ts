import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (authFn, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await authFn();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role ?? "customer";

  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isDashboardRoute(req)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip static assets and Next internals, always run on API/tRPC routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};