import type { Metadata } from "next";
import { FileText } from "@phosphor-icons/react/dist/ssr";
import { QuoteCard } from "@/components/quote/QuoteCard";
import { QuotesTable } from "@/components/quote/QuotesTable";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { Button } from "@/components/shared/buttons/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusFilterTabs } from "@/components/dashboard/StatusFilterTabs";
import { getMyQuotes } from "@/features/quote/lib/getQuotes";
import { QUOTE_STATUS_VALUES, QUOTE_STATUS_LABELS, type QuoteStatus } from "@/database/constants/quote-status";

export const metadata: Metadata = { title: "My Quotes" };

interface QuotesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const status = QUOTE_STATUS_VALUES.includes(params.status as QuoteStatus)
    ? (params.status as QuoteStatus)
    : undefined;

  const quotes = await getMyQuotes(status);

  const filterOptions = [
    { label: "All", href: "/dashboard/quotes", active: !status },
    ...QUOTE_STATUS_VALUES.map((value) => ({
      label: QUOTE_STATUS_LABELS[value],
      href: `/dashboard/quotes?status=${value}`,
      active: status === value,
    })),
  ];

  return (
    <div>
      <PageHeader
        variant="light"
        title="Your Quotes"
        description="Track every charter request from submission to approval."
        actions={
          <Button href="/request-charter" variant="outline" className="whitespace-nowrap">
            Request a Charter
          </Button>
        }
      />

      {/* One continuous surface: filters sit directly on top of the results
          they control, so the section reads as a single card rather than
          separate floating pieces. */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto border-b border-slate-100 px-4 py-3 sm:px-6">
          <StatusFilterTabs options={filterOptions} />
        </div>

        <div className="p-4 sm:p-6">
          {quotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title="No quotes found"
              description="Submit a charter request to see it appear here."
              action={
                <Button href="/request-charter" variant="outline">
                  Request a Charter
                </Button>
              }
            />
          ) : (
            <>
              <QuotesTable quotes={quotes} />
              <div className="space-y-4 md:hidden">
                {quotes.map((quote) => (
                  <QuoteCard key={quote._id} quote={quote} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}