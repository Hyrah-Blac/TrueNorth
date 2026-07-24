import { Skeleton, SkeletonRowCard } from "@/components/shared/skeleton/Skeleton";

export default function AdminPaymentsLoading() {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      <div className="mt-6">
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="mt-4 space-y-4">
        <SkeletonRowCard />
        <SkeletonRowCard />
        <SkeletonRowCard />
        <SkeletonRowCard />
      </div>
    </div>
  );
}
