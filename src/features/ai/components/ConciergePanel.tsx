"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { useConcierge } from "../context/ConciergeContext";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { ConciergeHeader } from "./ConciergeHeader";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { QuoteProgress } from "./QuoteProgress";
import { ChatInput } from "./ChatInput";

interface ConciergePanelProps {
  open: boolean;
  onClose: () => void;
  welcomeMessage: string;
  starterPrompts: string[];
}

export function ConciergePanel({ open, onClose, welcomeMessage, starterPrompts }: ConciergePanelProps) {
  const {
    messages,
    isSending,
    toolStatusLabel,
    error,
    hasConversation,
    sendMessage,
    retryLastMessage,
    startNewConversation,
    maxMessageLength,
  } = useConcierge();

  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open, onClose);

  return createPortal(
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop — light scrim, click-to-close preserved */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-navy-950/15 transition-opacity duration-500 ease-editorial ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Floating panel — full-screen on mobile, floating card from sm: up */}
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
        <ConciergeHeader onClose={onClose} onNewConversation={startNewConversation} hasConversation={hasConversation} />

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {hasConversation ? (
            <>
              <MessageList
                messages={messages}
                isSending={isSending}
                toolStatusLabel={toolStatusLabel}
                error={error}
                onRetry={retryLastMessage}
              />
              <QuoteProgress />
            </>
          ) : (
            <WelcomeScreen
              onSelect={(prompt) => void sendMessage(prompt)}
              welcomeMessage={welcomeMessage}
              starterPrompts={starterPrompts}
            />
          )}
        </div>

        <ChatInput onSend={(text) => void sendMessage(text)} disabled={isSending} maxLength={maxMessageLength} />
      </div>
    </div>,
    document.body
  );
}