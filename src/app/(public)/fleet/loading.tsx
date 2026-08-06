import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function FleetLoading() {
  return (
    <div>
      {/* Hero placeholder — matches FleetHero's min-h-[70svh] so the page
          doesn't jump in height once the real hero (with its background
          image) mounts. */}
      <div className="flex min-h-[70svh] items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-3 w-40 bg-white/10" />
          <Skeleton className="h-9 w-72 max-w-full bg-white/10" />
          <Skeleton className="h-3 w-56 max-w-full bg-white/10" />
        </div>
      </div>

      <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
        {/* Filters skeleton — hairline-bordered block matching FleetFilters'
            label, underline tabs, and passenger control. */}
        <div className="flex flex-col gap-8 border-y border-slate-200/70 py-10">
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-wrap gap-x-9 gap-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-16" />
            ))}
          </div>
          <div className="flex items-center gap-5 border-t border-slate-200/70 pt-7">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Grid skeleton — stacked, alternating split rows matching
            AircraftCard's text-panel + photo-panel layout. */}
        <div className="mt-10 flex flex-col gap-8 sm:gap-10">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`animate-fade-in-editorial flex flex-col overflow-hidden rounded-2xl sm:min-h-[20rem] md:min-h-[22rem] lg:min-h-[24rem] ${
                index % 2 === 1 ? "sm:flex-row-reverse" : "sm:flex-row"
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex w-full flex-col justify-center gap-4 bg-slate-100 p-8 sm:w-1/2 sm:shrink-0 sm:p-12 md:p-16">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-7 w-2/3" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="mt-2 h-3 w-16" />
              </div>
              <Skeleton className="h-56 w-full rounded-none sm:h-auto sm:flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}