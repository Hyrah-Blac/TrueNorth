import { Skeleton } from "@/components/shared/skeleton/Skeleton";

export default function CompareLoading() {
  return (
    <div className="border-t border-slate-200 bg-slate-50 py-14 lg:py-16">
      <div className="mx-auto max-w-container px-6 lg:px-10">
        <Skeleton className="h-3 w-20" />
        <div className="mt-6 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-7 w-56" />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}