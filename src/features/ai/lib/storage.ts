import type { ConciergeMessage } from "../types";

const SESSION_KEY = "tnc_concierge_session";
const CONVERSATION_KEY = "tnc_concierge_conversation";
const MESSAGES_KEY = "tnc_concierge_messages";

/** Caps how much history is replayed from storage — keeps hydration fast
 *  and bounds localStorage size; the server holds the full transcript. */
const MAX_STORED_MESSAGES = 50;

function isBrowser() {
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
  return safeGet(SESSION_KEY);
}

export function setStoredSessionId(sessionId: string): void {
  safeSet(SESSION_KEY, sessionId);
}

export function getStoredConversationId(): string | null {
  return safeGet(CONVERSATION_KEY);
}

export function setStoredConversationId(conversationId: string): void {
  safeSet(CONVERSATION_KEY, conversationId);
}

export function getStoredMessages(): ConciergeMessage[] {
  const raw = safeGet(MESSAGES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ConciergeMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoredMessages(messages: ConciergeMessage[]): void {
  const trimmed = messages.slice(-MAX_STORED_MESSAGES);
  safeSet(MESSAGES_KEY, JSON.stringify(trimmed));
}

export function clearStoredConversation(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(CONVERSATION_KEY);
    window.localStorage.removeItem(MESSAGES_KEY);
  } catch {
    // Ignore — see safeGet.
  }
}
