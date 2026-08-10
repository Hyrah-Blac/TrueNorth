import { Skeleton, SkeletonRowCard, SkeletonTable } from "@/components/shared/skeleton/Skeleton";

export default function QuotesLoading() {
  return (
    <div>
      <div className="flex flex-col gap-4 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
          <Skeleton className="h-9 w-full max-w-md rounded-md" />
        </div>

        <div className="p-4 sm:p-6">
          <SkeletonTable rows={5} />
          <div className="space-y-4 md:hidden">
            <SkeletonRowCard />
            <SkeletonRowCard />
            <SkeletonRowCard />
            <SkeletonRowCard />
          </div>
        </div>
      </div>
    </div>
  );
}