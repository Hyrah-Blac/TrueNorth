import { Skeleton, SkeletonRowCard, SkeletonTable, SkeletonStatCard } from "@/components/shared/skeleton/Skeleton";

export default function PaymentsLoading() {
  return (
    <div>
      <div className="pb-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-8 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-5 pb-7 sm:grid-cols-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <SkeletonTable rows={5} />
      <div className="space-y-4 md:hidden">
        <SkeletonRowCard />
        <SkeletonRowCard />
        <SkeletonRowCard />
      </div>
    </div>
  );
}
