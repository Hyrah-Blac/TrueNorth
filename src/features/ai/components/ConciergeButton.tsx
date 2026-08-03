"use client";

import { Headset } from "lucide-react";

export function ConciergeButton({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open the Concierge"
      aria-haspopup="dialog"
      aria-expanded={open}
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
      className={`group animate-fade-up-editorial fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_32px_-10px_rgba(37,99,235,0.55)] transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_40px_-10px_rgba(37,99,235,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        open ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Brief welcome pulse — invites a first-time visitor's eye to the
          button for a few seconds, then settles so it never nags. Reduced
          motion is respected via the project's global animation override. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-[ping_1.8s_ease-in-out_3] rounded-full bg-blue-400/40"
      />

      <Headset className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />

      <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center">
        <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-500/60" />
        <span className="h-2.5 w-2.5 rounded-full border-2 border-blue-600 bg-green-500" />
      </span>

      {/* Hover tooltip — hidden by default, fades/slides in on hover or
          keyboard focus. Positioned to the left of the button so it never
          runs off-screen against the right edge. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-navy-900 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.18)] opacity-0 transition-all duration-200 ease-out translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      >
        Need help?
      </span>
    </button>
  );
}