import { Skeleton } from "@/components/shared/skeleton/Skeleton";

// ─── Compare page skeleton ────────────────────────────────────────────────────
// ComparePage is a client component that fetches aircraft client-side, so
// this loading.tsx only fires on the initial SSR load — it should match
// the static chrome (back link + heading) and the aircraft card grid that
// shows while `loading === true` inside CompareContent.

// The page renders up to 4 aircraft (grid-cols-4 at lg+). We skeleton 3
// cards — the most common compare count — matching the real card shape:
// rounded-xl border bg-white + aspect-[4/3] image + name + category label.

function CompareCardSkeleton({ index: cardIdx }: { index: number }) {
  const base = cardIdx * 5 + 20;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      {/* Aircraft photo */}
      <Skeleton className="aspect-[4/3] w-full rounded-lg" index={base} />
      {/* Aircraft name */}
      <Skeleton className="h-5 w-2/3" index={base + 1} />
      {/* Category label */}
      <Skeleton className="h-3.5 w-1/2" index={base + 2} />
      {/* Divider */}
      <div className="h-px w-full bg-slate-100" aria-hidden="true" />
      {/* Remove button placeholder */}
      <Skeleton className="h-3.5 w-16" index={base + 3} />
    </div>
  );
}

export default function CompareLoading() {
  return (
    <div className="border-t border-slate-200 bg-slate-50 py-14 lg:py-16">
      <div className="mx-auto max-w-container px-6 lg:px-10">
        {/* Back link */}
        <Skeleton className="h-2.5 w-24" index={0} />

        {/* Page heading: icon + title */}
        <div className="mt-6 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" index={1} />
          <Skeleton className="h-7 w-52 sm:w-64" index={2} />
        </div>

        {/* Aircraft comparison cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CompareCardSkeleton key={i} index={i} />
          ))}
        </div>

        {/* Comparison table placeholder — appears below the cards in the
            real UI once both aircraft are loaded. */}
        <div className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          {/* Table header */}
          <div className="grid grid-cols-[180px,repeat(3,1fr)] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <Skeleton className="h-3 w-20" index={40} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-24" index={41 + i} />
            ))}
          </div>

          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="grid grid-cols-[180px,repeat(3,1fr)] gap-4 border-b border-slate-100 px-6 py-3.5 last:border-none"
            >
              <Skeleton className="h-3 w-24" index={44 + rowIdx * 4} />
              {Array.from({ length: 3 }).map((_, colIdx) => (
                <Skeleton key={colIdx} className="h-3 w-20" index={45 + rowIdx * 4 + colIdx} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}