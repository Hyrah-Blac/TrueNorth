import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AdminQuoteRow } from "@/components/admin/tables/AdminQuoteRow";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { FilterTabs } from "@/components/admin/layout/FilterTabs";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { getQuotesForAdmin } from "@/features/admin/lib/getQuotesForAdmin";
import { QUOTE_STATUS_VALUES, QUOTE_STATUS_LABELS, type QuoteStatus } from "@/database/constants/quote-status";

export const metadata: Metadata = { title: "Manage Quotes" };

interface AdminQuotesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminQuotesPage({ searchParams }: AdminQuotesPageProps) {
  const params = await searchParams;
  const status = QUOTE_STATUS_VALUES.includes(params.status as QuoteStatus)
    ? (params.status as QuoteStatus)
    : undefined;

  const quotes = await getQuotesForAdmin(status);

  return (
    <div>
   <PageHeader
  title="Quotes"
  description="Review and respond to charter requests submitted from the public site."
/>

      <FilterTabs
        options={[
          { label: "All", href: "/admin/quotes", active: !status },
          ...QUOTE_STATUS_VALUES.map((value) => ({
            label: QUOTE_STATUS_LABELS[value],
            href: `/admin/quotes?status=${value}`,
            active: status === value,
          })),
        ]}
      />

      <div className="mt-6">
        <ListToolbar count={quotes.length} noun="quote" />
      </div>

      <div className="mt-4 space-y-4">
        {quotes.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            title="No quotes found"
            description="Charter requests submitted from the public site will appear here."
          />
        ) : (
          quotes.map((quote) => <AdminQuoteRow key={quote._id} quote={quote} />)
        )}
      </div>
    </div>
  );
}