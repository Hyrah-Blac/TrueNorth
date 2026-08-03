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
import { sendConciergeMessage, toConciergeError } from "../lib/api";
import { usePageContext } from "../lib/pageContext";
import { generateSessionId } from "../lib/session";
import { extractPassengerCount, type TripDraft } from "../lib/tripDraft";
import {
  clearStoredConversation,
  getStoredConversationId,
  getStoredMessages,
  getStoredSessionId,
  setStoredConversationId,
  setStoredMessages,
  setStoredSessionId,
} from "../lib/storage";
import type { ConciergeError, ConciergeMessage } from "../types";

const MAX_MESSAGE_LENGTH = 2000;

interface ConciergeContextValue {
  messages: ConciergeMessage[];
  isSending: boolean;
  error: ConciergeError | null;
  hasConversation: boolean;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => void;
  dismissError: () => void;
  startNewConversation: () => void;
  maxMessageLength: number;
  tripDraft: TripDraft;
  setTripDraftAirport: (role: "departure" | "destination", code: string, name: string) => void;
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
  const [messages, setMessages] = useState<ConciergeMessage[]>(() => getStoredMessages());
  const [isSending, setIsSending] = useState(false);
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

      persistMessages((prev) => [...prev, optimisticUserMessage]);

      const extractedPassengers = extractPassengerCount(trimmed);
      if (extractedPassengers) {
        setTripDraft((prev) => ({ ...prev, passengerCount: extractedPassengers }));
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await sendConciergeMessage(
          {
            message: trimmed,
            conversationId: conversationIdRef.current,
            sessionId: sessionIdRef.current ?? undefined,
            pageContext: pageContextRef.current,
          },
          controller.signal
        );

        conversationIdRef.current = response.conversationId;
        setStoredConversationId(response.conversationId);
        if (response.sessionId && response.sessionId !== sessionIdRef.current) {
          sessionIdRef.current = response.sessionId;
          setStoredSessionId(response.sessionId);
        }

        const assistantMessage: ConciergeMessage = {
          ...response.message,
          status: "sent",
        };

        persistMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        lastFailedTextRef.current = trimmed;
        setError(toConciergeError(err));
        // Mark the optimistic user message as failed rather than removing
        // it, so the person can see exactly what didn't send.
        persistMessages((prev) =>
          prev.map((message) =>
            message._id === optimisticUserMessage._id ? { ...message, status: "failed" } : message
          )
        );
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
        abortRef.current = null;
      }
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
      error,
      hasConversation: messages.length > 0,
      sendMessage,
      retryLastMessage,
      dismissError,
      startNewConversation,
      maxMessageLength: MAX_MESSAGE_LENGTH,
      tripDraft,
      setTripDraftAirport,
    }),
    [
      messages,
      isSending,
      error,
      sendMessage,
      retryLastMessage,
      dismissError,
      startNewConversation,
      tripDraft,
      setTripDraftAirport,
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
