"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { sendConciergeMessage } from "../lib/api";
import { usePageContext } from "../lib/pageContext";
import { generateSessionId } from "../lib/session";
import { extractPassengerCount, mentionsPets, type TripDraft } from "../lib/tripDraft";
import {
  clearStoredConversation,
  getStoredConversationId,
  getStoredMessages,
  getStoredSessionId,
  setStorageScope,
  setStoredConversationId,
  setStoredMessages,
  setStoredSessionId,
} from "../lib/storage";
import type { ConciergeError, ConciergeMessage } from "../types";

const MAX_MESSAGE_LENGTH = 2000;

interface ConciergeContextValue {
  messages: ConciergeMessage[];
  isSending: boolean;
  /** Tool-aware loading label while a tool call is in flight, e.g.
   *  "Searching aircraft…" — null once text starts streaming in. */
  toolStatusLabel: string | null;
  error: ConciergeError | null;
  hasConversation: boolean;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => void;
  dismissError: () => void;
  startNewConversation: () => void;
  maxMessageLength: number;
  tripDraft: TripDraft;
  setTripDraftAirport: (role: "departure" | "destination", code: string, name: string) => void;
  setTripDraftAircraft: (slug: string) => void;
}

const ConciergeContext = createContext<ConciergeContextValue | null>(null);

function createLocalId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type MessagesUpdater = ConciergeMessage[] | ((prev: ConciergeMessage[]) => ConciergeMessage[]);

export function ConciergeProvider({ children }: { children: ReactNode }) {
  // Lazy-initialized directly from localStorage so the first render
  // already shows the restored conversation — no mount-effect round trip,
  // so returning visitors never see a flash of the welcome screen before
  // their history pops in. Safe here because this provider only ever
  // mounts client-side (dynamically imported with ssr:false).
  //
  // NOTE: at this point Clerk hasn't resolved yet, so this reads under
  // the default anonymous scope. The user-change effect below re-points
  // storage at the correct namespace and re-hydrates as soon as Clerk
  // reports who's signed in, so this is only ever a same-tick starting
  // point, not a source of cross-user leakage.
  const [messages, setMessages] = useState<ConciergeMessage[]>(() => getStoredMessages());
  const [isSending, setIsSending] = useState(false);
  const [toolStatusLabel, setToolStatusLabel] = useState<string | null>(null);
  const [error, setError] = useState<ConciergeError | null>(null);
  const [tripDraft, setTripDraft] = useState<TripDraft>({});

  // Session-scoped only (not persisted to localStorage) — a trip draft
  // reflects the visitor's current planning session, not something that
  // should silently resurface stale departure/destination picks on a
  // return visit days later.
  const pageContext = usePageContext();
  const pageContextRef = useRef<string | undefined>(pageContext);
  useEffect(() => {
    pageContextRef.current = pageContext;
  }, [pageContext]);

  const sessionIdRef = useRef<string | null>(null);
  if (sessionIdRef.current === null) {
    const stored = getStoredSessionId();
    sessionIdRef.current = stored ?? generateSessionId();
    if (!stored) setStoredSessionId(sessionIdRef.current);
  }

  const conversationIdRef = useRef<string | undefined>(getStoredConversationId() ?? undefined);
  const lastFailedTextRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Mirrors `isSending` synchronously so a second send fired before React
  // re-renders (e.g. a fast double Enter) is rejected deterministically,
  // rather than racing on a state value that's still stale in closure.
  const isSendingRef = useRef(false);

  // ── Clerk user isolation ────────────────────────────────────────────────
  // Tracks the previously-known Clerk user id so we can tell apart three
  // situations: Clerk hasn't resolved yet (`undefined`), the first time we
  // learn who's signed in (`previous === undefined`), and an actual
  // sign-in/sign-out/account-switch (`previous !== clerkUserId`). Only the
  // last one should reset conversation state.
  const { isLoaded, user } = useUser();
  const clerkUserId = isLoaded ? user?.id ?? null : undefined;
  const previousClerkUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (clerkUserId === undefined) return; // Clerk hasn't resolved yet.

    const previousClerkUserId = previousClerkUserIdRef.current;
    previousClerkUserIdRef.current = clerkUserId;

    if (previousClerkUserId === undefined) {
      // First resolution after mount. The initial state above was read
      // under the default anonymous scope before we knew who the user
      // was — point storage at the real namespace and re-hydrate from
      // it (this is also what carries an existing authenticated user
      // over to the new namespaced keys with no crash and no stale data
      // from another visitor: their own history, if any, was already
      // under their own namespace).
      setStorageScope(clerkUserId);
      conversationIdRef.current = getStoredConversationId() ?? undefined;
      setMessages(getStoredMessages());
      const storedSessionId = getStoredSessionId();
      sessionIdRef.current = storedSessionId ?? generateSessionId();
      if (!storedSessionId) setStoredSessionId(sessionIdRef.current);
      return;
    }

    if (previousClerkUserId === clerkUserId) return; // No real change.

    // The signed-in user changed — login, logout, or switching accounts
    // on the same browser. Isolate the new session completely so the
    // next person never inherits the previous person's conversation.
    abortRef.current?.abort();
    isSendingRef.current = false;
    setIsSending(false);
    setToolStatusLabel(null);

    setStorageScope(clerkUserId);
    conversationIdRef.current = undefined;
    lastFailedTextRef.current = null;
    setMessages([]);
    setError(null);
    setTripDraft({});

    const newSessionId = generateSessionId();
    sessionIdRef.current = newSessionId;
    setStoredSessionId(newSessionId);
  }, [clerkUserId]);

  // Persists to localStorage and updates state from a single source of
  // truth, whether given a new array or a functional updater — this lets
  // sendMessage/retryLastMessage operate on the latest messages without
  // depending on (and being recreated by) the `messages` state itself.
  const persistMessages = useCallback((updater: MessagesUpdater) => {
    setMessages((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setStoredMessages(next);
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!trimmed || isSendingRef.current) return;

      isSendingRef.current = true;
      setIsSending(true);
      setToolStatusLabel(null);
      setError(null);
      lastFailedTextRef.current = null;

      const now = new Date().toISOString();
      const optimisticUserMessage: ConciergeMessage = {
        _id: createLocalId(),
        conversationId: conversationIdRef.current,
        role: "user",
        content: trimmed,
        toolCalls: [],
        createdAt: now,
        updatedAt: now,
        status: "sent",
      };

      // The assistant's reply starts life as an empty placeholder in the
      // same list — MessageList shows the typing indicator only while
      // this message has no content yet; once the first chunk lands,
      // this same bubble grows in place instead of a separate indicator
      // being swapped out for a new message.
      const assistantPlaceholderId = createLocalId();
      const assistantPlaceholder: ConciergeMessage = {
        _id: assistantPlaceholderId,
        conversationId: conversationIdRef.current,
        role: "assistant",
        content: "",
        toolCalls: [],
        createdAt: now,
        updatedAt: now,
        status: "streaming",
      };

      persistMessages((prev) => [...prev, optimisticUserMessage, assistantPlaceholder]);

      const extractedPassengers = extractPassengerCount(trimmed);
      const petsMentioned = mentionsPets(trimmed);
      if (extractedPassengers || petsMentioned) {
        setTripDraft((prev) => ({
          ...prev,
          ...(extractedPassengers ? { passengerCount: extractedPassengers } : {}),
          ...(petsMentioned ? { hasPets: true } : {}),
        }));
      }

      const controller = new AbortController();
      abortRef.current = controller;

      await sendConciergeMessage(
        {
          message: trimmed,
          conversationId: conversationIdRef.current,
          sessionId: sessionIdRef.current ?? undefined,
          pageContext: pageContextRef.current,
        },
        {
          onToolStatus: (label) => setToolStatusLabel(label),
          onChunk: (delta) => {
            // First chunk arriving means the reply has genuinely started
            // — the labeled/dot indicator gives way to the growing bubble.
            setToolStatusLabel(null);
            persistMessages((prev) =>
              prev.map((message) =>
                message._id === assistantPlaceholderId
                  ? { ...message, content: message.content + delta }
                  : message
              )
            );
          },
          onDone: (response) => {
            conversationIdRef.current = response.conversationId;
            setStoredConversationId(response.conversationId);
            if (response.sessionId && response.sessionId !== sessionIdRef.current) {
              sessionIdRef.current = response.sessionId;
              setStoredSessionId(response.sessionId);
            }

            // Swap the local placeholder for the real, fully-persisted
            // message (real id/timestamps/toolCalls) so a page refresh
            // restores exactly what the server has.
            persistMessages((prev) =>
              prev.map((message) =>
                message._id === assistantPlaceholderId
                  ? { ...response.message, status: "sent" }
                  : message
              )
            );

            setToolStatusLabel(null);
            isSendingRef.current = false;
            setIsSending(false);
            abortRef.current = null;
          },
          onError: (err) => {
            lastFailedTextRef.current = trimmed;
            setError(err);
            setToolStatusLabel(null);
            // Drop the incomplete streamed reply and mark the user's
            // message as failed rather than showing a truncated answer.
            persistMessages((prev) =>
              prev
                .filter((message) => message._id !== assistantPlaceholderId)
                .map((message) =>
                  message._id === optimisticUserMessage._id ? { ...message, status: "failed" } : message
                )
            );

            isSendingRef.current = false;
            setIsSending(false);
            abortRef.current = null;
          },
        },
        controller.signal
      );
    },
    [persistMessages]
  );

  const retryLastMessage = useCallback(() => {
    const text = lastFailedTextRef.current;
    if (!text) return;
    // Drop the failed optimistic bubble before resending — sendMessage
    // will push a fresh one.
    persistMessages((prev) => prev.filter((message) => message.status !== "failed"));
    void sendMessage(text);
  }, [persistMessages, sendMessage]);

  const dismissError = useCallback(() => setError(null), []);

  const setTripDraftAirport = useCallback((role: "departure" | "destination", code: string, name: string) => {
    setTripDraft((prev) =>
      role === "departure"
        ? { ...prev, departureAirportCode: code, departureAirportName: name }
        : { ...prev, destinationAirportCode: code, destinationAirportName: name }
    );
  }, []);

  const setTripDraftAircraft = useCallback((slug: string) => {
    setTripDraft((prev) => ({ ...prev, aircraftSlug: slug }));
  }, []);

  const startNewConversation = useCallback(() => {
    conversationIdRef.current = undefined;
    lastFailedTextRef.current = null;
    clearStoredConversation();
    setMessages([]);
    setError(null);
    setTripDraft({});
  }, []);

  // Cancel any in-flight request when the provider unmounts (i.e. the
  // panel closes and the lazy-loaded bundle tears down) rather than
  // leaving it to resolve into a component that no longer exists.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const value = useMemo<ConciergeContextValue>(
    () => ({
      messages,
      isSending,
      toolStatusLabel,
      error,
      hasConversation: messages.length > 0,
      sendMessage,
      retryLastMessage,
      dismissError,
      startNewConversation,
      maxMessageLength: MAX_MESSAGE_LENGTH,
      tripDraft,
      setTripDraftAirport,
      setTripDraftAircraft,
    }),
    [
      messages,
      isSending,
      toolStatusLabel,
      error,
      sendMessage,
      retryLastMessage,
      dismissError,
      startNewConversation,
      tripDraft,
      setTripDraftAirport,
      setTripDraftAircraft,
    ]
  );

  return <ConciergeContext.Provider value={value}>{children}</ConciergeContext.Provider>;
}

export function useConcierge(): ConciergeContextValue {
  const ctx = useContext(ConciergeContext);
  if (!ctx) {
    throw new Error("useConcierge must be used within a ConciergeProvider");
  }
  return ctx;
}