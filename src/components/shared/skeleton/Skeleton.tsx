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

interface SkeletonProps {
  className?: string;
  /** Stagger offset in ms — delays animation-delay so adjacent skeletons
   *  don't sweep in perfect lockstep. Pass the element's render index. */
  index?: number;
}

export function Skeleton({ className = "", index = 0 }: SkeletonProps) {
  return (
    <div
      className={`skeleton animate-shimmer rounded-md ${className}`}
      style={{ animationDelay: `${index * 70}ms` }}
      aria-hidden="true"
    />
  );
}

/** A generic card-shaped skeleton matching BookingCard / PaymentCard / QuoteCard. */
export function SkeletonRowCard() {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
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

/** A stat-card shaped skeleton matching StatCard. */
export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" index={0} />
        <Skeleton className="h-8 w-8 rounded-md" index={1} />
      </div>
      <Skeleton className="mt-4 h-7 w-16" index={2} />
    </div>
  );
}
