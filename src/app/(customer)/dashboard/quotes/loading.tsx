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
 *   mobile  → stacked flex-col (label + value per field)
 *   lg+     → single-row grid [1fr 120px 56px 150px 110px]
 */
function QuoteRowSkeleton({ index: rowIdx }: { index: number }) {
  const base = rowIdx * 7 + 10;
  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl bg-white p-5 pr-9 shadow-sm lg:grid lg:grid-cols-[1fr_120px_56px_150px_110px] lg:items-center lg:gap-5"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Col 1: label + route */}
      <div>
        <Skeleton className="h-2.5 w-20"   index={base}     />
        <Skeleton className="mt-2 h-5 w-36" index={base + 1} />
      </div>

      {/* Cols 2-5 wrap on mobile, lay out in grid on lg */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:contents">
        <Skeleton className="h-4 w-24"             index={base + 2} /> {/* date */}
        <Skeleton className="h-4 w-10"             index={base + 3} /> {/* pax */}
        <Skeleton className="h-5 w-20 rounded-full" index={base + 4} /> {/* status badge */}
        <Skeleton className="h-4 w-20 lg:ml-auto"  index={base + 5} /> {/* amount */}
      </div>

      {/* Chevron placeholder — right-aligned, absolute on real row */}
      <Skeleton className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full" index={base + 6} />
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