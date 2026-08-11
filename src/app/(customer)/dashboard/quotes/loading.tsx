import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function QuotesLoading() {
  return (
    <div className="max-w-4xl">
      <div className="pb-7">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-8 w-72 rounded-full" />
      </div>

      <div className="divide-y divide-slate-100 border-t border-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="relative flex flex-col gap-3 py-5 pr-8 lg:grid lg:grid-cols-[1fr_120px_56px_150px_110px] lg:items-center lg:gap-5 lg:pr-9"
          >
            <div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
            <div className="flex flex-wrap items-center gap-4 lg:contents">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20 lg:ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}