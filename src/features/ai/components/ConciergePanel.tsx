"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useConcierge } from "../context/ConciergeContext";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { ConciergeHeader } from "./ConciergeHeader";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { QuoteProgress } from "./QuoteProgress";
import { ChatInput } from "./ChatInput";
import { ConfirmNewConversation } from "./ConfirmNewConversation";

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
  // Owned here (not inside ConciergeHeader) because confirming now takes
  // over the panel body, not just the header button — see
  // ConfirmNewConversation.
  const [confirmingNewConversation, setConfirmingNewConversation] = useState(false);

  useFocusTrap(panelRef, open, onClose);

  function handleConfirmNewConversation() {
    setConfirmingNewConversation(false);
    startNewConversation();
  }

  return createPortal(
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop — light scrim with a soft blur, click-to-close preserved */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-navy-950/15 backdrop-blur-[2px] transition-opacity duration-500 ease-editorial ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Floating panel — full-screen on mobile, floating card from sm: up.
          rounded-2xl (16px) is softer than the brand's usual --radius-xl
          token for a more premium, less boxy feel, while staying well
          short of the old 28px pill. shadow-lifted + shadow-glow layer a
          soft sapphire-tinted glow under the main drop shadow. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="concierge-panel-title"
        tabIndex={-1}
        className={`absolute inset-0 flex flex-col overflow-hidden rounded-none bg-white shadow-lifted ring-1 ring-glass-border transition-all duration-500 ease-editorial
          sm:inset-auto sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:right-6 sm:h-[min(600px,calc(100vh-7rem))] sm:w-[440px] sm:rounded-2xl sm:shadow-[var(--shadow-lifted),var(--shadow-glow)]
          ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"}`}
      >
        <ConciergeHeader
          onClose={onClose}
          onRequestNewConversation={() => setConfirmingNewConversation(true)}
          hasConversation={hasConversation}
        />

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {confirmingNewConversation ? (
            <ConfirmNewConversation
              onConfirm={handleConfirmNewConversation}
              onCancel={() => setConfirmingNewConversation(false)}
            />
          ) : hasConversation ? (
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

        {/* Input hidden during the confirm step — nothing to type into a
            confirmation screen, and hiding it keeps full attention on
            the decision being asked. */}
        {confirmingNewConversation ? null : (
          <ChatInput onSend={(text) => void sendMessage(text)} disabled={isSending} maxLength={maxMessageLength} />
        )}
      </div>
    </div>,
    document.body
  );
}