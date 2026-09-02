import { Skeleton } from "@/components/shared/skeleton/Skeleton";

// ─── Hero ────────────────────────────────────────────────────────────────────
// Matches DestinationsHero: min-h-[82svh] → 85svh at lg, navy bg, centred text.

function DestinationsHeroSkeleton() {
  return (
    <div className="relative flex min-h-[82svh] items-center justify-center overflow-hidden bg-navy-950 lg:min-h-[85svh]">
      {/* Ambient radial — same depth hint as the real hero scrim stack */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 60%, rgba(25,45,70,0.5), transparent 68%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        {/* Two-line headline */}
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-10 w-64 max-w-[80vw] bg-white/10 sm:h-12 sm:w-80" index={0} />
          <Skeleton className="h-10 w-48 max-w-[70vw] bg-white/10 sm:h-12 sm:w-64" index={1} />
        </div>
        {/* Thin divider line — matches `mx-auto mt-8 h-px w-12 bg-white/30` */}
        <Skeleton className="h-px w-12 bg-white/10" index={2} />
        {/* Sub-copy — two lines */}
        <div className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-3 w-72 max-w-[85vw] bg-white/10 sm:w-96" index={3} />
          <Skeleton className="h-3 w-56 max-w-[75vw] bg-white/10 sm:w-80" index={4} />
        </div>
      </div>
    </div>
  );
}

// ─── Explorer filter bar ──────────────────────────────────────────────────────
// DestinationsExplorer renders:
//   • a pill-group segmented control (All / Domestic / Regional)
//   • a vertical hairline divider (sm+)
//   • category chip row (All / Safari / Coastal / Urban / Remote)
// All inside a rounded-2xl border bg-white card.

function ExplorerFilterSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:p-4">
      {/* Segmented region control */}
      <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
        {["w-28", "w-20", "w-32"].map((w, i) => (
          <Skeleton key={i} className={`h-8 ${w} rounded-full`} index={i} />
        ))}
      </div>

      {/* Divider */}
      <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" aria-hidden="true" />

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto">
        {["w-14", "w-18", "w-20", "w-16", "w-20"].map((w, i) => (
          <Skeleton key={i} className={`h-8 ${w} shrink-0 rounded-full`} index={i + 5} />
        ))}
      </div>
    </div>
  );
}

// ─── Destination card ─────────────────────────────────────────────────────────
// DestinationCard: alternating split row — text panel + photo panel.
// Mobile: photo on top (h-56), text below.
// sm+: side-by-side, min-h-[16rem] → 20rem at md → 22rem at lg.

function DestinationCardSkeleton({ reversed = false, index: cardIdx }: { reversed?: boolean; index: number }) {
  const base = cardIdx * 5 + 20;
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl sm:min-h-[16rem] md:min-h-[20rem] lg:min-h-[22rem] ${
        reversed ? "sm:flex-row-reverse" : "sm:flex-row"
      }`}
    >
      {/* Text panel */}
      <div
        className={`order-2 flex w-full flex-col justify-center gap-4 p-6 sm:order-none sm:w-[45%] sm:shrink-0 sm:p-8 md:p-10 ${
          reversed
            ? "bg-gradient-to-r from-slate-200 to-white"
            : "bg-gradient-to-r from-white to-slate-200"
        }`}
      >
        {/* Destination name */}
        <Skeleton className="h-4 w-32" index={base} />
        {/* Description lines */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full max-w-xs" index={base + 1} />
          <Skeleton className="h-3 w-4/5 max-w-[13rem]" index={base + 2} />
          <Skeleton className="h-3 w-3/5 max-w-[10rem]" index={base + 3} />
        </div>
        {/* "Charter this route" cue */}
        <Skeleton className="mt-1 h-3 w-28" index={base + 4} />
      </div>

      {/* Photo panel */}
      <Skeleton className="order-1 h-56 w-full rounded-none sm:order-none sm:h-auto sm:flex-1" index={base + 2} />
    </div>
  );
}

// ─── CTA banner at the bottom ─────────────────────────────────────────────────
// Section tone="white" with a split dark/image panel.

function CtaBannerSkeleton() {
  return (
    <div className="mx-auto max-w-container px-6 py-12 lg:px-10 lg:py-16">
      <div className="flex flex-col overflow-hidden rounded-2xl sm:min-h-[16rem] sm:flex-row">
        {/* Dark text panel */}
        <div className="flex w-full flex-col justify-center gap-5 bg-navy-900 p-7 sm:w-[42%] sm:shrink-0 sm:p-8 md:p-10">
          <Skeleton className="h-5 w-48 bg-white/10" index={80} />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full max-w-xs bg-white/10" index={81} />
            <Skeleton className="h-3 w-4/5 max-w-[200px] bg-white/10" index={82} />
          </div>
        </div>
        {/* Photo panel */}
        <Skeleton className="h-48 w-full rounded-none sm:h-auto sm:flex-1" index={83} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DestinationsLoading() {
  return (
    <div>
      <DestinationsHeroSkeleton />

      {/* Section tone="slate" — matches !pt-5 !pb-8 sm:!pt-6 sm:!pb-10 */}
      <div className="bg-slate-50">
        <div className="mx-auto max-w-container px-6 pb-8 pt-5 sm:pb-10 sm:pt-6 lg:px-10">
          <ExplorerFilterSkeleton />

          <div className="mt-6 flex flex-col gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <DestinationCardSkeleton key={i} reversed={i % 2 !== 0} index={i} />
            ))}
          </div>
        </div>
      </div>

      <CtaBannerSkeleton />
    </div>
  );
}