import Link from "next/link";
import { CalendarBlank, Users, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { CustomerQuoteStatusBadge } from "./CustomerQuoteStatusBadge";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import type { IQuote } from "@/types/quote";
import type { AirportNameInfo } from "@/lib/api/airportNames";

/**
 * One row, every breakpoint — same pattern as PaymentRow and BookingRow.
 * Below lg it stacks: quote number + route on the top line, a hairline
 * separates the date · passengers meta line, then status and price share
 * the last line. At lg+ it becomes a four-column grid — Quote (wide, so the route
 * stays on one line) / Meta / Status / Price — so the list reads evenly with no horizontal scrolling
 * at any width. The status + price wrapper uses `lg:contents` so it
 * disappears as a box at lg and its children become direct grid items,
 * without separate markup per breakpoint.
 *
 * Each row is its own rounded, softly-shadowed card (rounded-2xl,
 * shadow-sm, hairline border, no hover effects) and the whole card is the
 * link; the caret sits inline beside the price.
 *
 * quotes/loading.tsx mirrors this layout — keep the two in step.
 */
export function QuoteRow({
  quote,
  airportNames,
}: {
  quote: IQuote;
  /** City/name lookup keyed by ICAO/IATA code, batch-resolved by the
   * caller (one query for every row on the page instead of one per row).
   * A code missing from the map — or the prop being omitted entirely —
   * falls back to showing the raw airport code, same as before. */
  airportNames?: Record<string, AirportNameInfo>;
}) {
  const departureInfo = airportNames?.[quote.departureAirportCode.toUpperCase()];
  const destinationInfo = airportNames?.[quote.destinationAirportCode.toUpperCase()];

  const amount =
    quote.quotedAmount != null ? (
      <span className="spec-readout text-base font-semibold text-navy-900 sm:text-[15px]">
        {formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? quote.currency)}
      </span>
    ) : (
      <span className="text-xs text-slate-400">Pricing pending</span>
    );

  return (
    <Link
      href={`/dashboard/quotes/${quote._id}`}
      className="flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_160px_140px_130px] lg:items-center lg:gap-5"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Identity — quote number + route */}
      <div className="min-w-0">
        <p className="spec-readout text-[11px] text-slate-400">{quote.quoteNumber}</p>
        <RouteDisplay
          className="mt-1"
          size="sm"
          departure={{ code: quote.departureAirportCode, name: departureInfo }}
          destination={{ code: quote.destinationAirportCode, name: destinationInfo }}
        />
      </div>

      {/* Meta — date · passengers on one line, separated by a middot */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-4 text-sm text-slate-500 lg:border-0 lg:pt-0">
        <span className="inline-flex items-center gap-1.5">
          <CalendarBlank className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {formatDate(quote.departureDate)}
        </span>
        <span className="text-slate-300" aria-hidden="true">
          &middot;
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          aria-label={`${quote.passengerCount} passengers`}
        >
          <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {quote.passengerCount}
        </span>
      </div>

      {/* Status + price: share a line below lg, separate grid columns at lg+.
          The status badge already carries the "action needed" signal (pulsing
          dot + a label like "Quote Ready"), so no second tag sits beside it. */}
      <div className="flex items-center justify-between gap-3 lg:contents">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <CustomerQuoteStatusBadge status={quote.status} />
        </div>

        <div className="flex items-center justify-end gap-2">
          {amount}
          <CaretRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}