import "server-only";

/**
 * Single source of truth for "which IP made this request", used for every
 * IP-keyed rate limit in the app.
 *
 * x-forwarded-for is a comma-separated chain: every proxy that handles the
 * request appends the address it received the connection from. The LEFTMOST
 * entry is whatever the original caller chose to send, so it is fully
 * attacker-controlled — rate-limiting on it lets anyone evade a limit by
 * sending a fresh fake value with each request. The RIGHTMOST entry is the
 * one our own edge observed, which a client cannot forge.
 *
 * Previously this logic lived in rate-limit.ts and the M-Pesa webhook (both
 * correct) but was re-implemented with the leftmost entry in the quote
 * action, the payment actions and the ticket verify page. Keep it here so
 * the next call site cannot drift again.
 */
export function getClientIpFromHeaders(headers: Pick<Headers, "get">): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const hops = forwardedFor?.split(",").map((ip) => ip.trim()).filter(Boolean) ?? [];
  return hops.length > 0 ? hops[hops.length - 1] : "unknown";
}
