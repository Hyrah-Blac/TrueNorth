import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function AdminAircraftLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div
        className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="divide-y divide-slate-100 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-3.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}