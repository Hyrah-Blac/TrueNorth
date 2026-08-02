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
      {/* Backdrop — desktop only; the mobile fullscreen panel needs no scrim behind it. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 hidden bg-navy-950/30 backdrop-blur-[2px] transition-opacity duration-500 ease-editorial sm:block ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="concierge-panel-title"
        tabIndex={-1}
        className={`absolute inset-0 flex w-full flex-col bg-white shadow-lifted transition-all duration-500 ease-editorial sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px] sm:border-l sm:border-slate-200 ${
          open
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 sm:translate-x-8"
        }`}
      >
        <ConciergeHeader onClose={onClose} onNewConversation={startNewConversation} hasConversation={hasConversation} />

        {hasConversation ? (
          <MessageList messages={messages} isSending={isSending} error={error} onRetry={retryLastMessage} />
        ) : (
          <WelcomeScreen onSelect={(prompt) => void sendMessage(prompt)} />
        )}

        <ChatInput onSend={(text) => void sendMessage(text)} disabled={isSending} maxLength={maxMessageLength} />
      </div>
    </div>,
    document.body
  );
}
