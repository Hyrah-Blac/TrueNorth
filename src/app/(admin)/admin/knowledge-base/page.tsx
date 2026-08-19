import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KnowledgeBaseTable } from "@/components/admin/tables/KnowledgeBaseTable";
import { getKnowledgeBaseForAdmin } from "@/features/admin/actions/knowledge-base.actions";

export const metadata: Metadata = { title: "Knowledge Base" };

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    visibility?: string;
  }>;
}

export default async function AdminKnowledgeBasePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await getKnowledgeBaseForAdmin({
    page,
    limit: 20,
    search: params.search,
    category: params.category,
    status: params.status,
    visibility: params.visibility,
  });

  return (
    <div>
      <PageHeader
        variant="light"
        showTitle={false}
        title="Knowledge Base"
        description="Manage the AI concierge knowledge base. Published public entries are available to the AI for charter guidance."
      />
      <KnowledgeBaseTable initialEntries={result.entries} total={result.total} />
    </div>
  );
}
