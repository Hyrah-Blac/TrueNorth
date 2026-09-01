import { PageHeader } from "@/components/dashboard/PageHeader";

export default function AdminKnowledgeBaseLoading() {
  return (
    <div>
      <PageHeader variant="light" showTitle={false} title="Knowledge Base" description="Manage the AI concierge knowledge base." />
      <div
        className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse bg-slate-50" />
        ))}
      </div>
    </div>
  );
}