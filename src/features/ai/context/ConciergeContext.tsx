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
  clearTripDraftAirport: (role: "departure" | "destination") => void;
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
  // Start empty — never read localStorage at render time before Clerk has
  // resolved. Reading early would show whatever is in the anonymous scope,
  // which could be a previous user's anonymous session or bleed across
  // accounts. The identity effect below hydrates from the correct
  // namespace once Clerk reports who is actually here.
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
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

  // These refs are intentionally NOT seeded from localStorage at render
  // time — the identity effect below does that once the scope is known.
  const sessionIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const lastFailedTextRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Mirrors `isSending` synchronously so a second send fired before React
  // re-renders (e.g. a fast double Enter) is rejected deterministically,
  // rather than racing on a state value that's still stale in closure.
  const isSendingRef = useRef(false);

  // ── Generation counter ──────────────────────────────────────────────────
  // Incremented on every identity change (login / logout / account switch).
  // Each sendMessage call captures the current generation; its onDone /
  // onError callbacks compare against the ref before touching storage or
  // state. A reply that arrives after a sign-out is silently dropped
  // rather than writing into the newly-scoped namespace.
  const generationRef = useRef(0);

  // ── Clerk user isolation ────────────────────────────────────────────────
  // Tracks the previously-known Clerk user id so we can tell apart:
  //   undefined   — Clerk hasn't resolved yet (skip)
  //   same value  — no real change (skip)
  //   different   — first resolution, sign-in, sign-out, account switch
  const { isLoaded, user } = useUser();
  const clerkUserId = isLoaded ? user?.id ?? null : undefined;
  const previousClerkUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (clerkUserId === undefined) return; // Clerk hasn't resolved yet.

    const previousClerkUserId = previousClerkUserIdRef.current;
    previousClerkUserIdRef.current = clerkUserId;

    if (previousClerkUserId === clerkUserId) return; // No real change.

    // Identity changed — covers first resolution (undefined → value),
    // sign-in, sign-out, and account switch.
    //
    // 1. Abort any in-flight request immediately so its callbacks cannot
    //    write into the new namespace after we switch scope below.
    abortRef.current?.abort();
    isSendingRef.current = false;
    setIsSending(false);
    setToolStatusLabel(null);

    // 2. Bump the generation so any callbacks that somehow outlive the
    //    abort (e.g. a synchronous onError fired before abort propagates)
    //    detect a stale generation and silently drop their writes.
    generationRef.current += 1;

    // 3. Point storage at the correct namespace.
    //    Sign-in / account switch: use the Clerk user id — scoped, stable.
    //    Sign-out: use a fresh random suffix rather than the shared
    //    unsuffixed keys. This guarantees that if user A signs out and
    //    user B (or even user A again) chats anonymously, they never
    //    share or see each other's anonymous history.
    const scope =
      clerkUserId !== null
        ? clerkUserId
        : `anon_${generateSessionId()}`;

    setStorageScope(scope);

    // 4. Reset all session state.
    conversationIdRef.current = getStoredConversationId() ?? undefined;
    lastFailedTextRef.current = null;
    setError(null);
    setTripDraft({});

    const storedSessionId = getStoredSessionId();
    sessionIdRef.current = storedSessionId ?? generateSessionId();
    if (!storedSessionId) setStoredSessionId(sessionIdRef.current);

    // 5. Hydrate messages from the now-correct namespace.
    //    Sign-out always produces [] (fresh anonymous scope has nothing).
    //    Sign-in / account switch restores that user's own stored history.
    setMessages(getStoredMessages());
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

      // Capture the generation at call time. If the user signs out (or
      // switches accounts) while this request is in flight, the generation
      // will have been bumped and the abort fired — but even if a callback
      // runs synchronously before the abort propagates, this check ensures
      // it writes nothing into the new user's namespace.
      const myGeneration = generationRef.current;
      const isStale = () => generationRef.current !== myGeneration;

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
          onToolStatus: (label) => {
            if (isStale()) return;
            setToolStatusLabel(label);
          },
          onChunk: (delta) => {
            if (isStale()) return;
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
            if (isStale()) return;
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
            if (isStale()) return;
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

  const clearTripDraftAirport = useCallback((role: "departure" | "destination") => {
    setTripDraft((prev) => {
      const next = { ...prev };
      if (role === "departure") {
        delete next.departureAirportCode;
        delete next.departureAirportName;
      } else {
        delete next.destinationAirportCode;
        delete next.destinationAirportName;
      }
      return next;
    });
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
    return () => {
      abortRef.current?.abort();
    };
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
      clearTripDraftAirport,
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
      clearTripDraftAirport,
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