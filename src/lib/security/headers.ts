/**
 * Security headers applied to every response via next.config.ts's
 * headers() function:
 *
 *   import { securityHeaders } from "@/lib/security/headers";
 *   const nextConfig = {
 *     async headers() {
 *       return [{ source: "/(.*)", headers: securityHeaders }];
 *     },
 *   };
 *
 * The Content-Security-Policy header is NOT in this list — it needs a
 * fresh nonce on every request (see buildCspHeader below), and
 * next.config's headers() can't vary per-request. It's set in
 * src/middleware.ts instead, on every response middleware returns.
 */
import { getEnv } from "@/lib/config/env";

export const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/**
 * Builds the Content-Security-Policy value for one request, given a
 * fresh per-request nonce. Called from middleware, which sets the
 * result as the Content-Security-Policy response header and also
 * forwards the nonce itself as an `x-nonce` request header so Server
 * Components can read it via `headers()` and attach it to any inline
 * <script> they render (see src/components/shared/JsonLd.tsx).
 *
 * script-src carries three things at once, deliberately:
 *   - 'self' plus the Clerk/Cloudflare Turnstile host allowlist:
 *     lets those domains' externally-hosted <script src="..."> tags
 *     load exactly as before — nonces don't affect host-matched
 *     scripts at all.
 *   - 'nonce-<value>': the mechanism that replaces 'unsafe-inline'
 *     for genuinely inline scripts. Next.js automatically stamps this
 *     nonce onto the inline bootstrap/hydration scripts it renders
 *     once it sees the nonce in this response header — no extra
 *     wiring needed for those. Any inline <script> this app renders
 *     itself must carry the same nonce explicitly (via the `nonce`
 *     prop) or a CSP-aware browser will refuse to run it.
 *   - 'unsafe-inline' kept alongside the nonce as a no-cost fallback:
 *     per the CSP spec, any browser that understands nonce-sources
 *     ignores 'unsafe-inline' entirely once a nonce is present, so
 *     modern browsers get the full nonce-only protection. Only
 *     pre-CSP2 browsers (effectively none in real traffic today) fall
 *     back to the old unsafe-inline behavior — i.e. never worse than
 *     what was shipped before, and stricter everywhere it matters.
 *
 * style-src keeps 'unsafe-inline' un-nonced on purpose: CSP nonces
 * only cover <style> tags, not inline style="..." attributes, and
 * this app (like most React apps) renders plenty of the latter via
 * style={{...}}. There's no practical way to nonce those, so removing
 * 'unsafe-inline' from style-src would break real UI rather than
 * close a meaningful gap.
 */
export function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";

  // When Clerk is configured with a custom Frontend API domain (set via
  // CLERK_FRONTEND_API_DOMAIN, e.g. clerk.truenorthaircharters.com),
  // clerk-js loads its script/XHR/iframe traffic from that domain
  // instead of the default *.clerk.accounts.dev — so it has to be in
  // the allowlist too, or the browser silently blocks Clerk entirely
  // and every SignedIn/SignedOut/UserButton just never renders.
  const { CLERK_FRONTEND_API_DOMAIN } = getEnv();
  const clerkFrontendApiDomain = CLERK_FRONTEND_API_DOMAIN
    ? `https://${CLERK_FRONTEND_API_DOMAIN}`
    : "";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://clerk.com ${clerkFrontendApiDomain} https://challenges.cloudflare.com`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com ${clerkFrontendApiDomain}`,
    "font-src 'self' data:",
    `connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.com ${clerkFrontendApiDomain} https://challenges.cloudflare.com https://api.cloudinary.com https://o4511865337872384.ingest.us.sentry.io`,
    `frame-src 'self' https://*.clerk.accounts.dev ${clerkFrontendApiDomain} https://challenges.cloudflare.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}


export function applySecurityHeaders(response: Response): Response {
  for (const { key, value } of securityHeaders) {
    response.headers.set(key, value);
  }
  return response;
}