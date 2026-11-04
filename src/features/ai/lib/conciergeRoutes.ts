/**
 * Where the floating WhatsApp + AI Concierge buttons should NOT render,
 * even though the route sits inside a layout that normally shows them.
 *
 * Which layouts mount them at all:
 *   - (public)   marketing pages            -> yes
 *   - (auth)     sign-in / sign-up          -> yes (visitors get stuck here)
 *   - (customer) /dashboard/**              -> yes (bookings, quotes, payments)
 *   - (admin)    /admin/**                  -> no  (staff tooling; the layout
 *                                              never mounts them)
 *   - /maintenance                          -> no  (site is offline)
 *
 * The prefixes below are the exceptions inside the "yes" layouts.
 */
const HIDDEN_PATH_PREFIXES = [
  // Transient OAuth handshake — a spinner that redirects within a second.
  "/sso-callback",
  // Opened by whoever scans a ticket's QR code to check someone in; a
  // focused verification result, not a browsing page.
  "/ticket/verify",
  // Defensive: never show on staff or maintenance routes even if a layout
  // change later moves them under a shared wrapper.
  "/admin",
  "/maintenance",
];

export function isConciergeHiddenPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return HIDDEN_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}