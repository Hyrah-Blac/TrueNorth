import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function DestinationsLoading() {
  return (
    <div>
      <div className="border-b border-navy-800 bg-navy-950 py-20 lg:py-28">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <Skeleton className="h-3 w-24 bg-white/10" />
          <Skeleton className="mt-4 h-10 w-96 max-w-full bg-white/10" />
          <Skeleton className="mt-4 h-4 w-full max-w-xl bg-white/10" />
        </div>
      </div>

      <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-slate-200 shadow-soft">
              <Skeleton className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-2 p-6">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}