import type { ConciergeMessage } from "../types";

const SESSION_KEY = "tnc_concierge_session";
const CONVERSATION_KEY = "tnc_concierge_conversation";
const MESSAGES_KEY = "tnc_concierge_messages";

/** Caps how much history is replayed from storage — keeps hydration fast
 *  and bounds localStorage size; the server holds the full transcript. */
const MAX_STORED_MESSAGES = 50;

// The active storage scope. `null` = anonymous visitor, in which case we
// keep using the original unsuffixed keys exactly as before (requirement:
// anonymous behaviour must stay byte-for-byte identical). Once a Clerk
// user id is set via setStorageScope(), every read/write below is
// namespaced to that user so two different people on the same browser
// never share a cached session, conversation, or message history.
let currentScope: string | null = null;

/**
 * Points the storage layer at a given user's namespace. Call this
 * whenever the signed-in Clerk user changes (login, logout, or account
 * switch) *before* reading/writing so all storage calls below land in
 * the right place. Pass `null`/`undefined` for anonymous visitors.
 */
export function setStorageScope(clerkUserId: string | null | undefined): void {
  currentScope = clerkUserId ?? null;
}

function scopedKey(base: string): string {
  return currentScope ? `${base}_${currentScope}` : base;
}

export function isBrowser() {
  return typeof window !== "undefined";
}

function safeGet(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage can throw in private-browsing modes or when quota is
    // exceeded — the concierge should degrade to session-only memory,
    // never crash the page.
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore — see safeGet.
  }
}

export function getStoredSessionId(): string | null {
  return safeGet(scopedKey(SESSION_KEY));
}

export function setStoredSessionId(sessionId: string): void {
  safeSet(scopedKey(SESSION_KEY), sessionId);
}

export function getStoredConversationId(): string | null {
  return safeGet(scopedKey(CONVERSATION_KEY));
}

export function setStoredConversationId(conversationId: string): void {
  safeSet(scopedKey(CONVERSATION_KEY), conversationId);
}

export function getStoredMessages(): ConciergeMessage[] {
  const raw = safeGet(scopedKey(MESSAGES_KEY));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ConciergeMessage[];
    if (!Array.isArray(parsed)) return [];
    // A "streaming" status can only be persisted if the tab closed or
    // refreshed mid-reply — there's no live connection left to finish
    // it, so it would otherwise restore as a permanently empty bubble.
    return parsed.filter((message) => message.status !== "streaming");
  } catch {
    return [];
  }
}

export function setStoredMessages(messages: ConciergeMessage[]): void {
  const trimmed = messages.slice(-MAX_STORED_MESSAGES);
  safeSet(scopedKey(MESSAGES_KEY), JSON.stringify(trimmed));
}

export function clearStoredConversation(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(scopedKey(CONVERSATION_KEY));
    window.localStorage.removeItem(scopedKey(MESSAGES_KEY));
  } catch {
    // Ignore — see safeGet.
  }
}