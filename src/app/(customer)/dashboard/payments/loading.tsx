import { Skeleton, SkeletonRowCard, SkeletonTable } from "@/components/shared/skeleton/Skeleton";

export default function PaymentsLoading() {
  return (
    <div>
      <div className="pb-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-8 w-36" />
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