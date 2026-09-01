/**
 * Circular progress ring with a percentage in the center and a label
 * underneath — the small stat "donuts" on the admin overview page.
 * Pure SVG, no chart library needed for a single-series ring.
 */
export function DonutStat({
  percent,
  color,
  label,
  detail,
}: {
  /** 0–100 */
  percent: number;
  color: string;
  label: string;
  /** Small line under the label, e.g. a raw count. */
  detail?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-[76px] w-[76px]">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="none"
            stroke="rgb(var(--color-slate-100))"
            strokeWidth="7"
          />
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-navy-900">
          {Math.round(clamped)}%
        </span>
      </div>
      <p className="mt-2.5 text-xs font-medium text-slate-600">{label}</p>
      {detail ? <p className="text-[11px] text-slate-400">{detail}</p> : null}
    </div>
  );
}
