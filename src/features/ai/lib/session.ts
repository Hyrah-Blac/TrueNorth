/**
 * Generates a client-side session identifier for anonymous conversation
 * continuity. Must satisfy the backend's sessionId schema: 8–128 chars,
 * `[a-zA-Z0-9_-]` only (see src/lib/ai/chat.schema.ts). `crypto.randomUUID()`
 * already produces exactly that character set.
 */
export function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers without crypto.randomUUID.
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
}
