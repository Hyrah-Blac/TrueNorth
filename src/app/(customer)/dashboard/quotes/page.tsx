import type { Metadata } from "next";
import { FileText } from "@phosphor-icons/react/dist/ssr";
import { QuoteRow } from "@/components/quote/QuoteRow";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusFilterTabs } from "@/components/dashboard/StatusFilterTabs";
import { getMyQuotes } from "@/features/quote/lib/getQuotes";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
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

  // One batched lookup for every route on the page — city names read far
  // friendlier to a customer than bare ICAO codes ("Nairobi" vs "FZFE"),
  // and a single query here is far cheaper than resolving inside each row.
  const airportNames = await getAirportNamesByCodes(
    quotes.flatMap((quote) => [quote.departureAirportCode, quote.destinationAirportCode])
  );

  const filterOptions = [
    { label: "All", href: "/dashboard/quotes", active: !status },
    ...QUOTE_STATUS_VALUES.map((value) => ({
      label: QUOTE_STATUS_LABELS[value],
      href: `/dashboard/quotes?status=${value}`,
      active: status === value,
    })),
  ];

  return (
    <div className="max-w-4xl">
      <PageHeader
        variant="light"
        title="Your Quotes"
        description="Track every charter request from submission to approval."
      />

      {/* Filter tabs render their own border — just give them room to
          breathe from the list below instead of doubling the border. */}
      <div className="mb-6">
        <StatusFilterTabs options={filterOptions} />
      </div>

      {quotes.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            title="No quotes found"
            description="Submit a charter request to see it appear here."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {quotes.map((quote) => (
            <QuoteRow key={quote._id} quote={quote} airportNames={airportNames} />
          ))}
        </div>
      )}
    </div>
  );
}