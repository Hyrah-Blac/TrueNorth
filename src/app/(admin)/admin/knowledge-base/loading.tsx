import { PageHeader } from "@/components/dashboard/PageHeader";

export default function AdminKnowledgeBaseLoading() {
  return (
    <div>
      <PageHeader title="Knowledge Base" description="Manage the AI concierge knowledge base." />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
