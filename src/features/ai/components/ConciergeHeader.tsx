"use client";

import { Headset, X, MessageSquarePlus } from "lucide-react";

interface ConciergeHeaderProps {
  onClose: () => void;
  onRequestNewConversation: () => void;
  hasConversation: boolean;
}

export function ConciergeHeader({ onClose, onRequestNewConversation, hasConversation }: ConciergeHeaderProps) {
  return (
    // relative + overflow-hidden so the HUD background layer below is
    // clipped to the header strip rather than bleeding into the rest of
    // the panel — this is the one "futuristic" moment, kept contained.
    <div className="relative overflow-hidden border-b border-slate-100">
      {/* Futuristic background layer — fine sapphire grid (flight-
          instrument HUD reference, fits the aviation brand better than a
          generic sci-fi look) plus two soft glow blooms. Entirely
          decorative: pointer-events-none, aria-hidden, and low opacity so
          it reads as atmosphere behind the header content, not as noise
          competing with it. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(43,91,191,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(43,91,191,0.08) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute -left-8 -top-14 h-36 w-36 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute -right-10 -top-16 h-32 w-32 rounded-full bg-champagne-400/20 blur-3xl" />
      </div>

      <div
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        className="relative flex items-center justify-between px-6 pb-5 sm:px-10"
      >
        <div className="flex items-center gap-3">
          {/* rounded-xl, not rounded-full — matches the persona-marker
              treatment used for the avatar in MessageBubble/TypingIndicator.
              overflow-hidden + the conic-gradient span inside gives a slow
              radar-style scan sweep across the badge, the signature
              "futuristic" detail. Online-status dot stays circular and
              sits outside the clipped avatar so it isn't cut off. */}
          <div className="relative h-10 w-10 shrink-0">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-champagne-500 to-champagne-600 text-navy-950 shadow-crisp">
              <span
                className="absolute inset-0 animate-spin motion-reduce:hidden [animation-duration:5s]"
                style={{
                  backgroundImage:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.55) 35deg, transparent 70deg)",
                }}
                aria-hidden="true"
              />
              <Headset className="relative z-10 h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-green-500">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-500/60 motion-reduce:hidden" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="concierge-panel-title" className="font-display text-sm font-semibold text-navy-900">
                AI Concierge
              </h2>
              <span className="text-[10px] uppercase tracking-widest2 text-green-600">Online</span>
            </div>
            <p className="text-xs font-body text-slate-500">Private Charter Advisor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasConversation ? (
            <>
              <button
                type="button"
                onClick={onRequestNewConversation}
                aria-label="Start a new conversation"
                title="Start a new conversation"
                className="flex h-6 w-6 items-center justify-center text-slate-400 transition-colors duration-300 hover:text-navy-900"
              >
                <MessageSquarePlus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
            </>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Concierge"
            className="flex h-6 w-6 items-center justify-center text-slate-400 transition-colors duration-300 hover:text-navy-900"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}