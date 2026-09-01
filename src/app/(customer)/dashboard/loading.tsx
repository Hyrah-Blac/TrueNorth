import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function QuotesLoading() {
  return (
    <div>
      <div className="pb-7">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-8 w-72 rounded-full" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm lg:grid lg:grid-cols-[1fr_130px_64px_180px_120px] lg:items-center lg:gap-6"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-20 lg:ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}