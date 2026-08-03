"use client";

import { MessageCircle } from "lucide-react";

export function ConciergeButton({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Chat with our Concierge"
      aria-label="Open the Concierge"
      aria-haspopup="dialog"
      aria-expanded={open}
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
      className={`group animate-fade-up-editorial fixed right-6 z-40 flex h-14 items-center gap-3 rounded-full border border-white/10 bg-navy-950 pl-3 pr-3 text-white shadow-[0_12px_32px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-sky-400/30 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:pr-5 ${
        open ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Brief welcome pulse — invites a first-time visitor's eye to the
          button for a few seconds, then settles so it never nags. Reduced
          motion is respected via the project's global animation override. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-[ping_1.8s_ease-in-out_3] rounded-full bg-sky-400/40"
      />

      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-sky-500/20">
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center">
          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-green-500/60" />
          <span className="h-2 w-2 rounded-full border-2 border-navy-950 bg-green-500" />
        </span>
      </span>
      <span className="hidden font-display text-[13px] font-medium tracking-tight text-white sm:inline">
        Concierge
      </span>
    </button>
  );
}
