import { Skeleton } from "@/components/shared/skeleton/Skeleton";

/** Matches the PageHeader "light / no-divider" variant. */
function SkeletonPageHeader() {
  return (
    <div className="mb-8 sm:mb-10">
      <Skeleton className="h-3 w-28"         index={0} />
      <Skeleton className="mt-3 h-8 w-36"    index={1} />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" index={2} />
    </div>
  );
}

/**
 * Mirrors QuoteRow exactly:
 *   < lg → stacked card: number + route, hairline, date · pax, status + price
 *   lg+  → four-column grid [1fr 160px 140px 130px]
 */
function QuoteRowSkeleton({ index: rowIdx }: { index: number }) {
  const base = rowIdx * 7 + 10;
  return (
    <div
      className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_160px_140px_130px] lg:items-center lg:gap-5"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* identity: number + route */}
      <div>
        <Skeleton className="h-3 w-24" index={base} />
        <Skeleton className="mt-2 h-4 w-64 max-w-full" index={base + 1} />
      </div>

      {/* meta: date · pax */}
      <div className="flex items-center gap-3 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
        <Skeleton className="h-4 w-24" index={base + 2} />
        <Skeleton className="h-4 w-10" index={base + 3} />
      </div>

      {/* status + price (share a line below lg) */}
      <div className="flex items-center justify-between gap-3 lg:contents">
        <Skeleton className="h-5 w-20 rounded-full" index={base + 4} />
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-5 w-20" index={base + 5} />
          <Skeleton className="h-4 w-4 rounded-full" index={base + 6} />
        </div>
      </div>
    </div>
  );
}

export default function QuotesLoading() {
  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col justify-center py-8 sm:py-12 lg:py-16">
      <div>
        <SkeletonPageHeader />

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <QuoteRowSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}