/**
 * Skeleton primitives.
 *
 * The `.skeleton` CSS class (globals.css) handles the two-layer champagne-
 * gold shimmer and the slower ease timing. `animate-shimmer` (tailwind.config)
 * drives background-position. The `style` prop on each element adds a small
 * per-element animation-delay so children stagger their sweep rather than
 * all pulsing in sync — the offset is intentionally tiny (≤ 150ms) so the
 * stagger reads as "alive" not "broken".
 */

import type { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  /** Stagger offset in ms — delays animation-delay so adjacent skeletons
   *  don't sweep in perfect lockstep. Pass the element's render index. */
  index?: number;
  /** Extra inline styles (e.g. a percentage height for a bar-chart mock),
   *  merged with the animation-delay Skeleton sets itself. */
  style?: CSSProperties;
}

export function Skeleton({ className = "", index = 0, style }: SkeletonProps) {
  return (
    <div
      className={`skeleton animate-shimmer rounded-md ${className}`}
      style={{ animationDelay: `${index * 70}ms`, ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * A generic card-shaped skeleton matching BookingCard / PaymentCard / QuoteCard —
 * rounded-2xl, shadow-sm, hairline border, the same "premium" container used
 * for the admin dashboard's stat cards.
 */
export function SkeletonRowCard() {
  return (
    <div
      className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-[10px]" index={0} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" index={1} />
          <Skeleton className="h-3.5 w-48" index={2} />
          <Skeleton className="h-3 w-24" index={3} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <Skeleton className="h-5 w-24 rounded-full" index={4} />
        <Skeleton className="h-4 w-20" index={5} />
      </div>
    </div>
  );
}

/** A table-shaped skeleton matching BookingsTable / PaymentsTable / QuotesTable, for the md+ view. */
export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft md:block">
      {/* Header gets a faint champagne tint to mirror the real table header treatment */}
      <div className="flex items-center gap-6 border-b border-slate-100 bg-champagne-500/[0.02] px-6 py-4">
        <Skeleton className="h-3 w-16" index={0} />
        <Skeleton className="h-3 w-24" index={1} />
        <Skeleton className="h-3 w-20" index={2} />
        <Skeleton className="h-3 w-16" index={3} />
        <Skeleton className="ml-auto h-3 w-16" index={4} />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 px-6 py-4">
            <Skeleton className="h-4 w-20" index={rowIndex * 5 + 5} />
            <Skeleton className="h-4 w-28" index={rowIndex * 5 + 6} />
            <Skeleton className="h-4 w-20" index={rowIndex * 5 + 7} />
            <Skeleton className="h-5 w-20 rounded-full" index={rowIndex * 5 + 8} />
            <Skeleton className="ml-auto h-4 w-16" index={rowIndex * 5 + 9} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A stat-card shaped skeleton matching the premium editorial StatCard —
 *  same rounded-2xl / hairline-border / inset-highlight shell, with the
 *  uppercase mono label and light editorial value replaced by shimmer bars. */
export function SkeletonStatCard({ withHint = false }: { withHint?: boolean }) {
  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <Skeleton className="h-2 w-20" index={0} />
      <Skeleton className="mt-3 h-6 w-16" index={1} />
      {withHint ? <Skeleton className="mt-2 h-2 w-14" index={2} /> : null}
    </div>
  );
}

/** A donut-ring shaped skeleton matching DonutStat. */
export function SkeletonDonut() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-[76px] w-[76px]">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <circle
            cx="38"
            cy="38"
            r={30}
            fill="none"
            stroke="rgb(var(--color-slate-100))"
            strokeWidth="7"
          />
        </svg>
        <div className="absolute inset-[7px] overflow-hidden rounded-full">
          <Skeleton className="h-full w-full rounded-full" index={0} />
        </div>
      </div>
      <Skeleton className="mt-2.5 h-2.5 w-16" index={1} />
      <Skeleton className="mt-1.5 h-2 w-10" index={2} />
    </div>
  );
}