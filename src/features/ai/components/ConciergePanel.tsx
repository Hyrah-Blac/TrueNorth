"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { useConcierge } from "../context/ConciergeContext";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { ConciergeHeader } from "./ConciergeHeader";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ConciergePanelProps {
  open: boolean;
  onClose: () => void;
}

export function ConciergePanel({ open, onClose }: ConciergePanelProps) {
  const { messages, isSending, error, hasConversation, sendMessage, retryLastMessage, startNewConversation, maxMessageLength } =
    useConcierge();

  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open, onClose);

  return createPortal(
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop — no blur, just a light scrim. Not clickable: the
          panel should only close via the X button in the header. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none bg-navy-950/15 transition-opacity duration-500 ease-editorial ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Floating panel — full-screen on mobile, floating card from sm: up.
          Fixed height on desktop (rather than h-auto) so the growing
          textarea in ChatInput never resizes the card itself — the
          message list flexes to absorb the difference instead. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="concierge-panel-title"
        tabIndex={-1}
        className={`absolute inset-0 flex flex-col overflow-hidden bg-white shadow-[0_40px_90px_-12px_rgba(15,23,42,0.28),0_0_0_1px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition-all duration-500 ease-editorial
          sm:inset-auto sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:right-6 sm:h-[540px] sm:w-[440px] sm:rounded-[28px]
          ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"}`}
      >
        {/* Top — rounded via parent overflow-hidden on desktop */}
        <ConciergeHeader onClose={onClose} onNewConversation={startNewConversation} hasConversation={hasConversation} />

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {hasConversation ? (
            <MessageList messages={messages} isSending={isSending} error={error} onRetry={retryLastMessage} />
          ) : (
            <WelcomeScreen onSelect={(prompt) => void sendMessage(prompt)} />
          )}
        </div>

        {/* Bottom — sits flush inside the rounded container */}
        <ChatInput onSend={(text) => void sendMessage(text)} disabled={isSending} maxLength={maxMessageLength} />
      </div>
    </div>,
    document.body
  );
}