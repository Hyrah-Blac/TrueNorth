import { Skeleton } from "@/components/shared/skeleton/Skeleton";

// ─── Breadcrumb + header ─────────────────────────────────────────────────────
// Matches the bg-slate-50 / border-b header band above the two-column grid.

function DetailHeaderSkeleton() {
  return (
    <div className="border-b border-slate-200 bg-slate-50 py-14 lg:py-16">
      <div className="mx-auto max-w-container px-6 lg:px-10">
        {/* Back breadcrumb */}
        <Skeleton className="h-2.5 w-28" index={0} />
        {/* Aircraft name */}
        <Skeleton className="mt-4 h-9 w-64 max-w-full sm:h-11 sm:w-80" index={1} />
        {/* Category + tagline */}
        <Skeleton className="mt-3 h-3.5 w-52 max-w-full" index={2} />
      </div>
    </div>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────
// AircraftGallery: large hero image + view-toggle pills + thumbnail strip.

function GallerySkeleton() {
  return (
    <div>
      {/* Main hero image */}
      <Skeleton className="aspect-[16/10] w-full rounded-xl" index={10} />

      {/* View-mode pills (Interior / Exterior / All) */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-24 rounded-full" index={11} />
        <Skeleton className="h-8 w-24 rounded-full" index={12} />
        <Skeleton className="h-8 w-20 rounded-full" index={13} />
      </div>

      {/* Thumbnail strip — 5 small tiles */}
      <div className="mt-3 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-24 shrink-0 rounded-md" index={14 + i} />
        ))}
      </div>
    </div>
  );
}

// ─── Spec strip ──────────────────────────────────────────────────────────────
// SpecStrip: a row of key figures (range, speed, passengers, base) shown
// below the gallery before the full specs table.

function SpecStripSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-2 w-16" index={20 + i} />
          <Skeleton className="h-5 w-20" index={24 + i} />
        </div>
      ))}
    </div>
  );
}

// ─── Description block ───────────────────────────────────────────────────────

function DescriptionSkeleton() {
  return (
    <div className="mt-12 space-y-3">
      <Skeleton className="h-2.5 w-20" index={30} />
      <Skeleton className="h-6 w-44" index={31} />
      <div className="mt-1 space-y-2">
        <Skeleton className="h-3.5 w-full" index={32} />
        <Skeleton className="h-3.5 w-[95%]" index={33} />
        <Skeleton className="h-3.5 w-4/5" index={34} />
        <Skeleton className="h-3.5 w-3/5" index={35} />
      </div>
    </div>
  );
}

// ─── Amenities ───────────────────────────────────────────────────────────────
// AmenitiesList: heading + row of rounded-full badge chips.

function AmenitiesSkeleton() {
  return (
    <div className="mt-12 space-y-3">
      <Skeleton className="h-2.5 w-20" index={40} />
      <Skeleton className="h-6 w-36" index={41} />
      <div className="mt-2 flex flex-wrap gap-2.5">
        {[28, 32, 24, 28, 20, 32, 28].map((w, i) => (
          <Skeleton key={i} className={`h-8 w-${w} rounded-full`} index={42 + i} />
        ))}
      </div>
    </div>
  );
}

// ─── Performance / specs section ─────────────────────────────────────────────
// PerformanceBars + SpecificationsTable (appears further down the left col).

function SpecsSectionSkeleton() {
  return (
    <div className="mt-14 space-y-4 border-t border-slate-200 pt-10">
      <Skeleton className="h-2.5 w-20" index={50} />
      <Skeleton className="h-6 w-44" index={51} />

      {/* Performance bar rows */}
      <div className="mt-1 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-2 w-20 shrink-0" index={52 + i * 2} />
            <div className="flex-1">
              <Skeleton className="h-2 w-full rounded-full" index={53 + i * 2} />
            </div>
          </div>
        ))}
      </div>

      {/* Specs table placeholder */}
      <Skeleton className="mt-4 h-48 w-full rounded-xl" index={60} />
    </div>
  );
}

// ─── Sidebar booking / enquiry panel ─────────────────────────────────────────
// Sticky card on the right column: aircraft details list + two CTA buttons.

function SidebarSkeleton() {
  return (
    <div className="h-fit space-y-5 rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
      {/* Sidebar heading */}
      <Skeleton className="h-4 w-32" index={70} />

      {/* Key detail rows */}
      <div className="space-y-3">
        {[24, 20, 28, 24].map((w, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className={`h-3 w-${w}`} index={71 + i} />
            <Skeleton className="h-3 w-16" index={75 + i} />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-100" aria-hidden="true" />

      {/* CTA buttons */}
      <Skeleton className="h-12 w-full rounded-xl" index={80} />
      <Skeleton className="h-12 w-full rounded-xl" index={81} />

      {/* Compare toggle */}
      <Skeleton className="mx-auto h-4 w-28" index={82} />
    </div>
  );
}

// ─── Related aircraft carousel placeholder ────────────────────────────────────

function RelatedSkeleton() {
  return (
    <div className="mt-16 border-t border-slate-200 pt-12">
      <Skeleton className="h-6 w-48" index={90} />
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-100">
            <Skeleton className="aspect-[4/3] w-full rounded-none" index={91 + i} />
            <div className="space-y-2 p-5">
              <Skeleton className="h-2 w-20" index={94 + i} />
              <Skeleton className="h-5 w-32" index={97 + i} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AircraftDetailLoading() {
  return (
    <div>
      <DetailHeaderSkeleton />

      <div className="mx-auto max-w-container px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr,1fr] lg:gap-14">
          {/* Left column */}
          <div>
            <GallerySkeleton />
            <SpecStripSkeleton />
            <DescriptionSkeleton />
            <AmenitiesSkeleton />
            <SpecsSectionSkeleton />
            <RelatedSkeleton />
          </div>

          {/* Right column — sticky sidebar */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SidebarSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}