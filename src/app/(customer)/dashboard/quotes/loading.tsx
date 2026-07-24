import { Skeleton, SkeletonRowCard, SkeletonTable } from "@/components/shared/skeleton/Skeleton";

export default function QuotesLoading() {
  return (
    <div>
      <div className="pb-7">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-8 w-32" />
      </div>
      <Skeleton className="h-11 w-full max-w-md rounded-md" />
      <div className="mt-7">
        <SkeletonTable rows={5} />
        <div className="space-y-4 md:hidden">
          <SkeletonRowCard />
          <SkeletonRowCard />
          <SkeletonRowCard />
          <SkeletonRowCard />
        </div>
      </div>
    </div>
  );
}
