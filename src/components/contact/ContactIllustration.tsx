// Contact-page illustration: the soft pink backdrop shape with a staggered
// array of white, button-style messages in different sizes. Pure SVG, sharp
// at any size, no network request. Transparent background, so it sits
// directly on the page.
//
// Finish: the backdrop has a gentle tonal falloff, a light sheen and a soft
// ground shadow so it reads as a lit object rather than a flat shape; each
// message has a hairline edge and a two-layer shadow (tight contact + wide
// ambient) for depth, and rises into place once on load. Motion is a single
// short entrance and is switched off for reduced-motion users.

// Bubble geometry + copy. Text is centred in its pill; the baseline is derived
// from the pill's centre so it stays optically centred whatever the size.
const MESSAGES = [
  { x: 258, y: 88, w: 160, h: 40, size: 10.5, label: "Plan your flight" },
  { x: 190, y: 146, w: 226, h: 48, size: 11.5, label: "Available around the clock" },
  { x: 176, y: 212, w: 308, h: 64, size: 14, label: "Speak to our charter team" },
  { x: 272, y: 294, w: 196, h: 44, size: 11, label: "Ask about our fleet" },
  { x: 212, y: 356, w: 140, h: 38, size: 10.5, label: "Request a quote" },
] as const;

// Raleway's cap height is ~0.71em, so half of it (~0.355em) below the centre line
// puts the capitals' midpoint on the pill's centre.
const baseline = (m: (typeof MESSAGES)[number]) => m.y + m.h / 2 + m.size * 0.355;

export function ContactIllustration({ className }: { className?: string }) {
  return (
    <svg
      // Cropped to the artwork (backdrop spans x 112–522, y 34–420) so the labels
      // stay legible when the SVG shrinks to a phone-width column.
      viewBox="104 28 426 396"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Plan your flight, ask about our fleet, request a quote, and speak to our charter team, available around the clock"
      textRendering="geometricPrecision"
      // The ground shadow extends past the artwork; without this the SVG box clips it into a visible rectangle.
      style={{ overflow: "visible" }}
      className={className}
    >
      <style>{`
        @keyframes ct-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ct-fade { from { opacity: 0; } to { opacity: 1; } }
        .ct-backdrop { animation: ct-fade 1s ease-out both; }
        .ct-message { animation: ct-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .ct-backdrop, .ct-message { animation: none; }
        }
      `}</style>

      <defs>
        {/* Backdrop: lit from the upper left, deepening to a dusty rose at the far edge. */}
        <radialGradient id="ct-blob" cx="40%" cy="32%" r="82%">
          <stop offset="0" stopColor="#FCEFF4" />
          <stop offset="0.5" stopColor="#F8DEE9" />
          <stop offset="1" stopColor="#EFC5D6" />
        </radialGradient>
        {/* Soft sheen across the top of the backdrop. */}
        <radialGradient id="ct-sheen" cx="34%" cy="18%" r="52%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        {/* Messages: whisper of warmth at the bottom edge so the white isn't flat. */}
        <linearGradient id="ct-pill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFF9FC" />
        </linearGradient>
        {/* Two-layer shadow: wide ambient + tight contact. */}
        <filter id="ct-shadow" x="-25%" y="-80%" width="150%" height="300%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#9B3F63" floodOpacity="0.16" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#9B3F63" floodOpacity="0.1" />
        </filter>
        {/* Ground shadow that lifts the backdrop off the page. */}
        <filter id="ct-ground" x="-25%" y="-25%" width="150%" height="160%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="#B5517A" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* Backdrop */}
      <g className="ct-backdrop">
        <path
          d="M290 52 C400 34 506 112 514 218 C522 322 462 404 352 412 C242 420 146 382 128 288 C112 204 172 68 290 52 Z"
          fill="url(#ct-blob)"
          filter="url(#ct-ground)"
        />
        <path
          d="M290 52 C400 34 506 112 514 218 C522 322 462 404 352 412 C242 420 146 382 128 288 C112 204 172 68 290 52 Z"
          fill="url(#ct-sheen)"
        />
      </g>

      {/* Staggered white messages, largest in the middle */}
      {MESSAGES.map((m, i) => (
        <g key={m.label} className="ct-message" style={{ animationDelay: `${0.25 + i * 0.09}s` }}>
          <rect
            x={m.x}
            y={m.y}
            width={m.w}
            height={m.h}
            rx={m.h / 2}
            fill="url(#ct-pill)"
            stroke="#9B3F63"
            strokeOpacity="0.06"
            strokeWidth="1"
            filter="url(#ct-shadow)"
          />
          <text
            x={m.x + m.w / 2}
            y={baseline(m)}
            textAnchor="middle"
            fontFamily="Raleway, sans-serif"
            fontSize={m.size}
            fontWeight="500"
            letterSpacing="0.04em"
            fill="#0E2347"
          >
            {m.label}
          </text>
        </g>
      ))}
    </svg>
  );
}