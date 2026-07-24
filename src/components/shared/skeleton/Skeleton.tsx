export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton animate-shimmer rounded-md ${className}`} aria-hidden="true" />;
}

/** A generic card-shaped skeleton matching BookingCard / PaymentCard / QuoteCard. */
export function SkeletonRowCard() {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-start gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/** A table-shaped skeleton matching BookingsTable / PaymentsTable / QuotesTable, for the md+ view. */
export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft md:block">
      <div className="flex items-center gap-6 border-b border-slate-100 px-6 py-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 px-6 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-4 w-16" />
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
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-7 w-16" />
    </div>
  );
}
