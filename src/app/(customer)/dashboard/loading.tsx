import { Skeleton, SkeletonStatCard, SkeletonRowCard } from "@/components/shared/skeleton/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="pb-7">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-8 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonRowCard />
        <SkeletonRowCard />
        <SkeletonRowCard />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonRowCard />
        <SkeletonRowCard />
        <SkeletonRowCard />
      </div>
    </div>
  );
}
