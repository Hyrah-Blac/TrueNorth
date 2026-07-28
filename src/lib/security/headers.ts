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
 * Cloudinary and Clerk domains are allowlisted in the CSP since the
 * app depends on both for images and auth. challenges.cloudflare.com
 * is Clerk's Smart CAPTCHA (Cloudflare Turnstile) widget, required for
 * the sign-up flow's bot protection — without it, Clerk's backend
 * rejects sign-up requests with a 400 since no CAPTCHA token can be
 * generated. Extend connectSrc/imgSrc here if later phases (M-Pesa,
 * Resend, Google Maps) need it — don't relax the policy elsewhere.
 */
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
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com",
      "font-src 'self' data:",
     "connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.com https://challenges.cloudflare.com https://api.cloudinary.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

export function applySecurityHeaders(response: Response): Response {
  for (const { key, value } of securityHeaders) {
    response.headers.set(key, value);
  }
  return response;
}