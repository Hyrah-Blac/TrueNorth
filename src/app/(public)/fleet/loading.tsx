import { Skeleton } from "@/components/shared/skeleton/Skeleton";

// ─── Hero ────────────────────────────────────────────────────────────────────
// Matches FleetHero: min-h-[82svh] → 85svh at lg, dark navy bg, centred copy.

function FleetHeroSkeleton() {
  return (
    <div className="relative flex min-h-[82svh] items-center justify-center overflow-hidden bg-navy-950 lg:min-h-[85svh]">
      {/* Subtle ambient gradient — gives the dark field depth without
          importing an image; visible beneath the shimmer bars. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(30,50,80,0.55), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        {/* Eyebrow line */}
        <Skeleton className="h-2.5 w-32 bg-white/10" index={0} />
        {/* Headline — two lines matching the actual H1 */}
        <div className="flex flex-col items-center gap-2.5">
          <Skeleton className="h-10 w-72 max-w-[80vw] bg-white/10 sm:h-12 sm:w-96" index={1} />
          <Skeleton className="h-10 w-56 max-w-[70vw] bg-white/10 sm:h-12 sm:w-80" index={2} />
        </div>
        {/* Sub-copy */}
        <div className="mt-2 flex flex-col items-center gap-1.5">
          <Skeleton className="h-3 w-72 max-w-[85vw] bg-white/10 sm:w-96" index={3} />
          <Skeleton className="h-3 w-56 max-w-[75vw] bg-white/10 sm:w-80" index={4} />
        </div>
      </div>
    </div>
  );
}

// ─── Filters ─────────────────────────────────────────────────────────────────
// Matches FleetFilters: rounded-2xl gradient card, a single scrollable row
// of category chips (All + 8 categories) — no passenger-size row anymore.

function FleetFiltersSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.02] sm:mt-7 sm:p-4 md:mt-8 md:flex-row md:items-center lg:mt-9 lg:p-5">
      <div className="flex gap-2 overflow-x-auto pb-px lg:gap-2.5">
        {/* "All" chip — slightly narrower */}
        <Skeleton className="h-9 w-16 shrink-0 rounded-full md:h-7 lg:h-8" index={0} />
        {/* Per-category chips */}
        {[24, 28, 22, 24, 20, 26, 24, 22].map((w, i) => (
          <Skeleton
            key={i}
            className={`h-9 w-${w} shrink-0 rounded-full md:h-7 lg:h-8`}
            index={i + 1}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Aircraft grid cards ──────────────────────────────────────────────────────
// Matches AircraftCard: alternating split — text panel (bg-gradient) + photo
// panel. Mobile: photo on top (h-56), text stacked below. sm+: side-by-side.

function AircraftCardSkeleton({ reversed = false, index: cardIdx }: { reversed?: boolean; index: number }) {
  const base = cardIdx * 5 + 20;
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl sm:min-h-[20rem] md:min-h-[22rem] lg:min-h-[24rem] ${
        reversed ? "sm:flex-row-reverse" : "sm:flex-row"
      }`}
    >
      {/* Text panel */}
      <div
        className={`order-2 flex w-full flex-col justify-center gap-4 p-8 sm:order-none sm:w-1/2 sm:shrink-0 sm:p-12 md:p-16 ${
          reversed
            ? "bg-gradient-to-r from-slate-100 to-white"
            : "bg-gradient-to-r from-white to-slate-100"
        }`}
      >
        <Skeleton className="h-2 w-20" index={base} />      {/* category eyebrow */}
        <Skeleton className="h-5 w-36" index={base + 1} />  {/* aircraft name */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full max-w-xs" index={base + 2} />
          <Skeleton className="h-3 w-4/5 max-w-[14rem]" index={base + 3} />
        </div>
        <Skeleton className="mt-1 h-3 w-14" index={base + 4} /> {/* "Discover" cue */}
      </div>

      {/* Photo panel */}
      <Skeleton className="order-1 h-56 w-full rounded-none sm:order-none sm:h-auto sm:flex-1" index={base + 2} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FleetLoading() {
  return (
    <div>
      <FleetHeroSkeleton />

      {/* Section wrapping filters + grid — matches Section tone="slate" !pt-0 */}
      <div className="mx-auto max-w-container px-6 py-10 lg:px-10">
        <FleetFiltersSkeleton />

        <div className="mt-6 flex flex-col gap-8 sm:gap-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <AircraftCardSkeleton key={i} reversed={i % 2 !== 0} index={i} />
          ))}
        </div>

        {/* Pagination placeholder */}
        <div className="mt-12 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-full" index={i + 50} />
          ))}
        </div>
      </div>
    </div>
  );
}