import { PageHeader } from "@/components/dashboard/PageHeader";

export default function AdminAirportsLoading() {
  return (
    <div>
      <PageHeader title="Airport Database" description="Manage airports and airstrips." />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
