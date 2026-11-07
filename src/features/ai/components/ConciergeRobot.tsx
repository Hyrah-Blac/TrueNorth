/**
 * The AI Concierge mascot: a pearl-white robot head with a graphite visor,
 * two blinking cyan eyes and pulsing antenna tips. Drawn in SVG so every
 * surface (launcher, panel header, typing indicator, message avatar) shares
 * one design and none needs an image asset.
 *
 * Size and shadow come from the caller via className. Decorative only:
 * it is hidden from assistive tech, and its motion is switched off under
 * prefers-reduced-motion.
 */
export function ConciergeRobot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 110"
      aria-hidden="true"
      focusable="false"
      className={`select-none overflow-visible ${className ?? ""}`}
    >
      <style>{`
        .cr-eye{transform-box:fill-box;transform-origin:center;animation:cr-blink 6s infinite}
        .cr-eye-r{animation-delay:.05s}
        .cr-tip{transform-box:fill-box;transform-origin:center;animation:cr-pulse 2.4s ease-in-out infinite}
        @keyframes cr-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
        @keyframes cr-pulse{0%,100%{opacity:.55}50%{opacity:1}}
        @media (prefers-reduced-motion:reduce){.cr-eye,.cr-tip{animation:none!important}}
      `}</style>

      {/* Antenna */}
      <path d="M46 22 Q40 10 36 8" stroke="#DCE4EA" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M74 22 Q80 10 84 8" stroke="#DCE4EA" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle className="cr-tip" cx="36" cy="7" r="4" fill="#14B8E6" />
      <circle className="cr-tip" cx="84" cy="7" r="4" fill="#14B8E6" />

      {/* Shell */}
      <rect x="8" y="20" width="104" height="80" rx="40" fill="#FBFCFD" stroke="#DCE4EA" strokeWidth="1.5" />

      {/* Visor */}
      <rect x="20" y="34" width="80" height="50" rx="24" fill="#0D1620" />

      {/* Eyes: happy arcs with a cyan glow */}
      <g className="cr-eye">
        <path
          d="M32 66 Q42 50 52 66"
          fill="none"
          stroke="#14B8E6"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px #14B8E6)" }}
        />
      </g>
      <g className="cr-eye cr-eye-r">
        <path
          d="M68 66 Q78 50 88 66"
          fill="none"
          stroke="#14B8E6"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px #14B8E6)" }}
        />
      </g>

      {/* Ears */}
      <rect x="4" y="46" width="8" height="18" rx="4" fill="#DCE4EA" />
      <rect x="108" y="46" width="8" height="18" rx="4" fill="#DCE4EA" />
    </svg>
  );
}