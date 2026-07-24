import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function FleetLoading() {
  return (
    <div>
      <div className="border-b border-slate-200 bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-10 w-96 max-w-full" />
          <Skeleton className="mt-4 h-4 w-full max-w-xl" />
        </div>
      </div>

      <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="animate-fade-in-editorial overflow-hidden rounded-xl border border-slate-200 shadow-soft"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-7">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-3.5 w-1/2" />
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
