import { Skeleton } from "@/components/shared/skeleton/Skeleton";

/**
 * Loading state for /dashboard/bookings. Mirrors page.tsx + BookingRow:
 * same header block, same stacked card rows (< lg) and four-column grid
 * (lg+), so nothing shifts when the real content streams in.
 */

/** Matches the PageHeader "light / no-divider" variant (no eyebrow). */
function HeaderSkeleton() {
  return (
    <div className="mb-8 pb-7 sm:mb-10">
      <Skeleton className="h-10 w-56 max-w-full rounded-lg" index={0} />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" index={1} />
    </div>
  );
}

function RowSkeleton({ index: r }: { index: number }) {
  const b = r * 10 + 4;
  return (
    <div
      className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_150px_150px] lg:items-center lg:gap-6"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* identity (+ total on < lg) */}
      <div className="flex items-start justify-between gap-4 lg:block">
        <div>
          <Skeleton className="h-3 w-28" index={b} />
          <Skeleton className="mt-2 h-6 w-40" index={b + 1} />
        </div>
        <Skeleton className="h-5 w-20 shrink-0 lg:hidden" index={b + 2} />
      </div>

      {/* route */}
      <div className="space-y-2 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
        <Skeleton className="h-4 w-56 max-w-full" index={b + 3} />
        <Skeleton className="h-4 w-36" index={b + 4} />
      </div>

      {/* departure + status */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:flex-col lg:items-start">
        <Skeleton className="h-4 w-24" index={b + 5} />
        <Skeleton className="h-3 w-20" index={b + 6} />
      </div>

      {/* total + paid (lg+) */}
      <div className="hidden items-center justify-end gap-3 lg:flex">
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-5 w-20" index={b + 7} />
          <Skeleton className="h-1 w-20 rounded-full" index={b + 8} />
        </div>
        <Skeleton className="h-4 w-4 rounded-full" index={b + 9} />
      </div>
    </div>
  );
}

export default function BookingsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col justify-center py-8 sm:py-12 lg:py-16"
    >
      <span className="sr-only">Loading your bookings…</span>
      <div>
        <HeaderSkeleton />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}