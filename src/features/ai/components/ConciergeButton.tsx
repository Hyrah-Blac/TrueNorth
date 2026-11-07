"use client";

import { ConciergeRobot } from "./ConciergeRobot";

/**
 * Floating launcher for the AI Concierge. The launcher is a pearl-white
 * robot head with a graphite visor and two glowing cyan eyes, drawn in
 * SVG so it stays crisp at any size and needs no image asset.
 *  - the head floats gently, with a soft ground shadow that breathes
 *    in time with it,
 *  - a faint cool glow sits behind it so it lifts off light and dark pages,
 *  - the eyes blink every few seconds, and the antenna tips pulse,
 *  - on hover it hops, tilts and grows slightly,
 *  - the green "online" dot sits by its antenna,
 *  - a "Need help?" tooltip slides in on hover or keyboard focus.
 * All motion is decorative and switched off under prefers-reduced-motion.
 */
export function ConciergeButton({
  open,
  onOpen,
  onWarmUp,
}: {
  open: boolean;
  onOpen: () => void;
  onWarmUp?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerEnter={onWarmUp}
      onFocus={onWarmUp}
      aria-label="Open the Concierge"
      aria-haspopup="dialog"
      aria-expanded={open}
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      className={`group animate-fade-up-editorial fixed print:hidden right-5 z-40 flex h-[76px] w-[76px] items-center justify-center rounded-full transition-all duration-300 ease-editorial focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne-500 ${
        open ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        .cb-glow{animation:cb-glow 3.4s ease-in-out infinite}
        @keyframes cb-glow{0%,100%{opacity:.55}50%{opacity:.9}}
        @media (prefers-reduced-motion:reduce){.cb-glow{animation:none!important}}
      `}</style>

      {/* Soft cool glow behind the robot. */}
      <span
        aria-hidden="true"
        className="cb-glow pointer-events-none absolute inset-1 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(20,184,230,0.45) 0%, rgba(20,184,230,0) 70%)" }}
      />

      {/* Ground shadow. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-[50%] bg-slate-900/50 blur-[5px]"
      />

      <span className="relative block">
        <ConciergeRobot className="h-[68px] w-[68px] drop-shadow-[0_6px_10px_rgba(15,23,42,0.35)] transition-transform duration-700 ease-editorial group-hover:-translate-y-1 group-hover:scale-105 group-focus-visible:-translate-y-1 group-focus-visible:scale-105" />

        {/* Online dot, pinned to the head's upper right so it floats and
            tilts with the robot instead of hovering beside it. */}
        <span className="absolute left-[80%] top-[8%] flex h-3.5 w-3.5 items-center justify-center">
          <span className="absolute h-3.5 w-3.5 animate-ping rounded-full bg-green-500/60 motion-reduce:hidden" />
          <span className="h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow" />
        </span>
      </span>

      {/* Hover tooltip — left of the robot so it never runs off-screen. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full mr-2 translate-x-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 font-display text-[13px] font-medium text-navy-900 opacity-0 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      >
        Need help?
      </span>
    </button>
  );
}