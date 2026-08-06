/**
 * A navigational compass rose, drawn as plain SVG (no external asset) so
 * it can inherit `currentColor` and sit at whatever opacity the caller
 * wants. Sized to a 520x520 viewBox — the caller controls final
 * on-screen size via its wrapping element.
 */
export function CompassWatermark() {
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;

  const ticks = Array.from({ length: 36 }, (_, i) => i * 10).map((deg) => {
    const isCardinal = deg % 90 === 0;
    const isIntercardinal = deg % 45 === 0 && !isCardinal;
    const length = isCardinal ? 34 : isIntercardinal ? 22 : 12;
    const rad = ((deg - 90) * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * outerR;
    const y1 = cy + Math.sin(rad) * outerR;
    const x2 = cx + Math.cos(rad) * (outerR - length);
    const y2 = cy + Math.sin(rad) * (outerR - length);
    return { deg, x1, y1, x2, y2, isCardinal };
  });

  const labelR = outerR - 54;
  const labels = [
    { text: "N", deg: 0 },
    { text: "E", deg: 90 },
    { text: "S", deg: 180 },
    { text: "W", deg: 270 },
  ].map(({ text, deg }) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { text, x: cx + Math.cos(rad) * labelR, y: cy + Math.sin(rad) * labelR };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden="true">
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={outerR - 40} fill="none" stroke="currentColor" strokeWidth={0.75} />

      {ticks.map((t) => (
        <line
          key={t.deg}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeWidth={t.isCardinal ? 1.25 : 0.75}
        />
      ))}

      {/* Primary compass star, points to N/E/S/W */}
      <path
        d={`M ${cx} ${cy - outerR + 40} L ${cx + 26} ${cy} L ${cx} ${cy + outerR - 40} L ${cx - 26} ${cy} Z`}
        fill="currentColor"
        opacity={0.55}
      />
      {/* Secondary star, points to intercardinals, rotated 45deg from the primary */}
      <path
        d={`M ${cx - outerR + 40} ${cy} L ${cx} ${cy - 26} L ${cx + outerR - 40} ${cy} L ${cx} ${cy + 26} Z`}
        fill="currentColor"
        opacity={0.28}
      />

      <circle cx={cx} cy={cy} r={4} fill="currentColor" />

      {labels.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={16}
          fontFamily="var(--font-display)"
          fontWeight={600}
          fill="currentColor"
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}