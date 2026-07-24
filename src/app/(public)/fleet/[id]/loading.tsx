import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function AircraftDetailLoading() {
  return (
    <div>
      <div className="border-b border-slate-200 bg-slate-50 py-14 lg:py-16">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-11 w-80 max-w-full" />
          <Skeleton className="mt-3 h-4 w-64" />
        </div>
      </div>

      <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.6fr,1fr]">
          <div>
            <Skeleton className="aspect-[16/10] w-full" />

            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <div className="mt-4 flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-24 shrink-0" />
              ))}
            </div>

            <div className="mt-12 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="mt-12 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-40" />
              <div className="mt-2 flex flex-wrap gap-2.5">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>

            <div className="mt-14 space-y-4 border-t border-slate-200 pt-10">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-40" />
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>

          <div className="h-fit space-y-4 rounded-xl border border-slate-200 p-7 shadow-soft">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
