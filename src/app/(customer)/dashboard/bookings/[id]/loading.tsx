import { Skeleton } from "@/components/shared/skeleton/Skeleton";

// Mirrors the booking detail page: back link, reference + route header,
// then the two-column layout (flight details + day-of-travel on the left,
// payment on the right). On mobile the payment card comes first, same as
// the real page, so nothing jumps when the content loads.

const CARD = "rounded-xl border border-navy-900/10 bg-white p-6 sm:p-7";

function SkeletonField({ index, wide = false }: { index: number; wide?: boolean }) {
  return (
    <div>
      <Skeleton className="h-2.5 w-20" index={index} />
      <Skeleton className={`mt-2.5 h-4 ${wide ? "w-48" : "w-32"}`} index={index + 1} />
    </div>
  );
}

export default function BookingDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="mb-4 h-3 w-24" index={0} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Skeleton className="h-2.5 w-32" index={1} />
            <Skeleton className="mt-3 h-8 w-72 max-w-full" index={2} />
            <Skeleton className="mt-2.5 h-3 w-28" index={3} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" index={4} />
            <Skeleton className="h-9 w-28 rounded-full" index={5} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* Left: flight details + day-of-travel */}
        <div className="order-2 space-y-5 lg:order-1">
          <div className={CARD}>
            <Skeleton className="h-2.5 w-28" index={6} />
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SkeletonField index={7} />
              <SkeletonField index={9} />
              <SkeletonField index={11} />
              <SkeletonField index={13} wide />
            </div>
          </div>

          <div className={CARD}>
            <Skeleton className="h-2.5 w-28" index={15} />
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SkeletonField index={16} />
              <SkeletonField index={18} />
            </div>
          </div>
        </div>

        {/* Right: payment */}
        <aside className="order-1 h-fit lg:order-2">
          <div className="overflow-hidden rounded-xl border border-navy-900/10 bg-white">
            <div className="border-b border-navy-900/10 px-6 py-5 sm:px-7 sm:py-6">
              <Skeleton className="h-2.5 w-20" index={20} />
              <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-3 w-16" index={21} />
                <Skeleton className="h-3 w-24" index={22} />
              </div>
              <Skeleton className="mt-2 h-1.5 w-full rounded-full" index={23} />
            </div>
            <div className="divide-y divide-navy-900/10 px-6 sm:px-7">
              {[24, 26, 28].map((i) => (
                <div key={i} className="flex items-center justify-between py-3.5">
                  <Skeleton className="h-3.5 w-28" index={i} />
                  <Skeleton className="h-3.5 w-20" index={i + 1} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
} 