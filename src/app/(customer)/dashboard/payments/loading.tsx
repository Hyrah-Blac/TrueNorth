import { Skeleton } from "@/components/shared/skeleton/Skeleton";

/** Matches the PageHeader "light / no-divider" variant. */
function SkeletonPageHeader() {
  return (
    <div className="mb-8 sm:mb-10">
      <Skeleton className="h-3 w-28"                  index={0} />
      <Skeleton className="mt-3 h-8 w-48"             index={1} />
      <Skeleton className="mt-2 h-4 w-80 max-w-full"  index={2} />
    </div>
  );
}

/**
 * Mirrors PaymentRow:
 *   mobile  → stacked layout
 *   sm+     → single flex row (ref · booking · date · method · amount · receipt)
 */
function PaymentRowSkeleton({ index: rowIdx }: { index: number }) {
  const base = rowIdx * 7 + 10;
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Icon / avatar */}
      <Skeleton className="h-10 w-10 shrink-0 rounded-[10px]" index={base} />

      {/* Main content group */}
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        {/* Payment ref + booking ref */}
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-20"   index={base + 1} />
          <Skeleton className="h-4 w-32"   index={base + 2} />
        </div>

        {/* Date */}
        <Skeleton className="h-3.5 w-24 shrink-0" index={base + 3} />

        {/* Method badge */}
        <Skeleton className="h-5 w-20 shrink-0 rounded-full" index={base + 4} />

        {/* Amount — right side */}
        <Skeleton className="h-5 w-24 shrink-0 sm:ml-auto" index={base + 5} />

        {/* Receipt link */}
        <Skeleton className="h-4 w-16 shrink-0" index={base + 6} />
      </div>
    </div>
  );
}

export default function PaymentsLoading() {
  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col justify-center py-8 sm:py-12 lg:py-16">
      <div>
        <SkeletonPageHeader />

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PaymentRowSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}