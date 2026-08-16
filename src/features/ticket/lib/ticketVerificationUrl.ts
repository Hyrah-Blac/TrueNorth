import "server-only";
import { siteConfig } from "@/lib/config/site";

/**
 * Builds the public verification URL a ticket's QR code points to.
 * Uses the app's existing NEXT_PUBLIC_APP_URL-backed base URL
 * (siteConfig.url — see lib/config/site.ts) rather than a hard-coded
 * domain, so this resolves correctly in local dev, preview, and
 * production without a new environment variable.
 */
export function getTicketVerificationUrl(verificationToken: string): string {
  return `${siteConfig.url}/ticket/verify/${verificationToken}`;
}
