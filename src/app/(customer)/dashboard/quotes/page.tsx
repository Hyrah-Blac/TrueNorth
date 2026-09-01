import type { Metadata } from "next";
import { FileText } from "@phosphor-icons/react/dist/ssr";
import { QuoteRow } from "@/components/quote/QuoteRow";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getMyQuotes } from "@/features/quote/lib/getQuotes";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";

export const metadata: Metadata = { title: "My Quotes" };

// No status filter here — a customer's own quote history rarely runs
// past a handful of items, so a bank of filter pills (fine for the admin
// side, sorting through everyone's quotes) was more chrome than the
// list actually needed. Status is still visible per-quote via the badge
// on each QuoteRow.
export default async function QuotesPage() {
  const quotes = await getMyQuotes();

  // One batched lookup for every route on the page — city names read far
  // friendlier to a customer than bare ICAO codes ("Nairobi" vs "FZFE"),
  // and a single query here is far cheaper than resolving inside each row.
  const airportNames = await getAirportNamesByCodes(
    quotes.flatMap((quote) => [quote.departureAirportCode, quote.destinationAirportCode])
  );

  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col justify-center py-8 sm:py-12 lg:py-16">
      <div>
        <PageHeader
          variant="light"
          divider={false}
          title="Your Quotes"
          description="Track every charter request from submission to approval."
        />

        {quotes.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title="No quotes found"
              description="Submit a charter request to see it appear here."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <QuoteRow key={quote._id} quote={quote} airportNames={airportNames} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}