"use client";

import { useEffect, useRef, useState } from "react";
import { Headset, X, RotateCcw, Check } from "lucide-react";

interface ConciergeHeaderProps {
  onClose: () => void;
  onNewConversation: () => void;
  hasConversation: boolean;
}

const CONFIRM_TIMEOUT_MS = 3000;

export function ConciergeHeader({ onClose, onNewConversation, hasConversation }: ConciergeHeaderProps) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  function handleNewConversationClick() {
    if (!confirming) {
      setConfirming(true);
      confirmTimeoutRef.current = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }

    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    setConfirming(false);
    onNewConversation();
  }

  return (
    <div
      style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
      className="flex items-center justify-between border-b border-slate-100 px-6 pb-5 sm:px-10"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Headset className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-green-500">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-500/60" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 id="concierge-panel-title" className="font-display text-sm font-semibold text-navy-900">
              AI Concierge
            </h2>
            <span className="text-[10px] uppercase tracking-wide text-green-600">Online</span>
          </div>
          <p className="text-xs text-slate-500">Private Charter Advisor</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {hasConversation ? (
          <button
            type="button"
            onClick={handleNewConversationClick}
            onBlur={() => setConfirming(false)}
            aria-label={confirming ? "Confirm starting a new conversation" : "Start a new conversation"}
            title={confirming ? "Click again to confirm" : "Start a new conversation"}
            className={`flex h-8 items-center gap-1.5 rounded-full px-2 text-xs font-medium transition-all duration-300 active:scale-95 ${
              confirming
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {confirming ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="pr-0.5">Confirm?</span>
              </>
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Concierge"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-700 active:scale-95"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}