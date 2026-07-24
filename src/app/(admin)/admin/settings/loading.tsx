import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-soft">
      <Skeleton className="mb-7 h-4 w-full max-w-md" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-11 w-40 rounded-md" />
      </div>
    </div>
  );
}
