import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function AdminCustomersLoading() {
  return (
    <div>
      <Skeleton className="h-10 w-72" />
      <div
        className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="divide-y divide-slate-100 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-3.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}