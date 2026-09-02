import { Skeleton } from "@/components/shared/skeleton/Skeleton";

// ─── Shared primitives ────────────────────────────────────────────────────────

/** Matches the PageHeader "light / no-divider" variant used on every customer page. */
function SkeletonPageHeader({ titleW = "w-40" }: { titleW?: string }) {
  return (
    <div className="mb-8 sm:mb-10">
      <Skeleton className="h-3 w-28" index={0} />
      <Skeleton className={`mt-3 h-8 ${titleW}`} index={1} />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" index={2} />
    </div>
  );
}

// ─── Desktop table (md+) ─────────────────────────────────────────────────────

const TABLE_COLS: { label: string; w: string; ml?: boolean }[] = [
  { label: "ref",    w: "w-24" },
  { label: "route",  w: "w-36" },
  { label: "date",   w: "w-28" },
  { label: "pax",    w: "w-10" },
  { label: "status", w: "w-20 rounded-full" },
  { label: "action", w: "w-20", ml: true },
];

function BookingsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft md:block">
      {/* Header */}
      <div className="flex items-center gap-6 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
        {TABLE_COLS.map((col, i) => (
          <Skeleton
            key={col.label}
            className={`h-2.5 ${col.w} ${col.ml ? "ml-auto" : ""}`}
            index={i}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-6 px-6 py-4">
            <Skeleton className="h-4 w-24"  index={rowIdx * 6 + 10} />
            <Skeleton className="h-4 w-36"  index={rowIdx * 6 + 11} />
            <Skeleton className="h-4 w-28"  index={rowIdx * 6 + 12} />
            <Skeleton className="h-4 w-10"  index={rowIdx * 6 + 13} />
            <Skeleton className="h-5 w-20 rounded-full" index={rowIdx * 6 + 14} />
            <Skeleton className="ml-auto h-4 w-20" index={rowIdx * 6 + 15} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile card (< md) ──────────────────────────────────────────────────────

function BookingCardSkeleton({ index: cardIdx }: { index: number }) {
  const base = cardIdx * 8;
  return (
    <div
      className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Top row: icon + route + ref */}
      <div className="flex items-start gap-4">
        {/* Aircraft icon placeholder */}
        <Skeleton className="h-11 w-11 shrink-0 rounded-[10px]" index={base} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" index={base + 1} />   {/* booking ref */}
          <Skeleton className="h-5 w-40" index={base + 2} />   {/* route e.g. NBO → MBA */}
          <Skeleton className="h-3 w-28" index={base + 3} />   {/* date */}
        </div>
      </div>

      {/* Bottom row: status badge + ticket link */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <Skeleton className="h-5 w-24 rounded-full" index={base + 4} />
        <Skeleton className="h-4 w-20"              index={base + 5} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingsLoading() {
  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col justify-center py-8 sm:py-12 lg:py-16">
      <div>
        <SkeletonPageHeader titleW="w-44" />

        {/* Desktop table */}
        <BookingsTableSkeleton rows={5} />

        {/* Mobile cards */}
        <div className="space-y-4 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <BookingCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}