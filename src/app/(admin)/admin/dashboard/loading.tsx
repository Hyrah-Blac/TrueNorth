import { SkeletonStatCard, Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-56 w-full" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-56 w-full" />
        </div>
      </div>
    </div>
  );
}