import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { QuoteStatusBadge } from "@/components/quote/QuoteStatusBadge";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { formatDate } from "@/utils/date";
import type { IQuote } from "@/types/quote";
import type { AirportNameInfo } from "@/lib/api/airportNames";

// Divided list row, same shape as the customer-side QuoteRow
// (dashboard/quotes/page.tsx) — no card border, a soft hover wash, and an
// absolutely-positioned caret so it doesn't consume layout space.
export function AdminQuoteRow({
  quote,
  airportNames = {},
}: {
  quote: IQuote;
  airportNames?: Record<string, AirportNameInfo>;
}) {
  const departureInfo = airportNames[quote.departureAirportCode.toUpperCase()];
  const destinationInfo = airportNames[quote.destinationAirportCode.toUpperCase()];
  const customer =
    typeof quote.customer === "object" && quote.customer !== null
      ? (quote.customer as unknown as { firstName?: string; lastName?: string })
      : null;

  const wasRegisteredCustomer = quote.customer !== undefined;
  const customerLabel = customer
    ? ""
    : wasRegisteredCustomer
      ? " (deleted account)"
      : " (guest)";

  return (
    <Link
      href={`/admin/quotes/${quote._id}`}
      className="group relative -mx-3 flex flex-col gap-3 rounded-lg px-3 py-5 pr-8 transition-colors hover:bg-sky-500/[0.035] sm:flex-row sm:items-center sm:justify-between sm:pr-9"
    >
      <div className="min-w-0">
        <p className="spec-readout text-[11px] text-slate-400">{quote.quoteNumber}</p>
        <p className="mt-0.5 truncate font-editorial text-xl font-light text-navy-900">
          {quote.contactInfo.fullName}
          {customerLabel}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <RouteDisplay
            size="sm"
            departure={{ code: quote.departureAirportCode, name: departureInfo }}
            destination={{ code: quote.destinationAirportCode, name: destinationInfo }}
          />
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>{formatDate(quote.departureDate)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <QuoteStatusBadge status={quote.status} />
      </div>

      <CaretRight
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-sky-500 sm:right-1.5"
        aria-hidden="true"
      />
    </Link>
  );
}