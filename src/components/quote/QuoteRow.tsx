import Link from "next/link";
import { CalendarBlank, Users, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { CustomerQuoteStatusBadge } from "./CustomerQuoteStatusBadge";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import type { IQuote } from "@/types/quote";
import type { AirportNameInfo } from "@/lib/api/airportNames";

/**
 * One row, every breakpoint.
 *
 * - Below lg: route on its own line, then date/passengers/status flow
 *   together as a wrapping meta line, then price. The meta group uses
 *   `lg:contents` so it disappears as a box at lg — its children become
 *   direct grid items instead — without needing separate markup per
 *   breakpoint.
 * - At lg+: a defined 5-column grid (route / date / passengers / status /
 *   price), evenly distributed instead of one loose flex block.
 *
 * A caret on the right (absolutely positioned, so it doesn't consume a
 * grid track) signals the row is clickable at every width.
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
  const departureCity = airportNames?.[quote.departureAirportCode.toUpperCase()]?.city ?? quote.departureAirportCode;
  const destinationCity =
    airportNames?.[quote.destinationAirportCode.toUpperCase()]?.city ?? quote.destinationAirportCode;

  return (
    <Link
      href={`/dashboard/quotes/${quote._id}`}
      className="group relative -mx-3 flex flex-col gap-3 rounded-lg px-3 py-5 pr-8 transition-colors hover:bg-sky-500/[0.035] lg:grid lg:grid-cols-[1fr_120px_56px_150px_110px] lg:items-center lg:gap-5 lg:pr-9"
    >
      <div className="min-w-0">
        <p className="spec-readout text-[11px] text-slate-400">{quote.quoteNumber}</p>
        <p className="mt-0.5 truncate font-editorial text-xl font-light text-navy-900">
          {departureCity}{" "}
          <span className="spec-readout text-xs font-normal text-slate-400">{quote.departureAirportCode}</span>
          <span className="mx-1.5 text-slate-300">→</span>
          {destinationCity}{" "}
          <span className="spec-readout text-xs font-normal text-slate-400">{quote.destinationAirportCode}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 lg:contents">
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <CalendarBlank className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formatDate(quote.departureDate)}
        </span>

        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {quote.passengerCount}
        </span>

        {/* The status badge itself already carries the "action needed"
            signal (pulsing dot + a label like "Quote Ready" for approved
            quotes) — a second "Ready to review" tag next to it repeated
            the same message and, at narrower widths (e.g. this row inside
            the dashboard's 3-column card grid), forced the two onto
            separate lines. One clear signal reads calmer and fits at any
            width without wrapping. */}
        <CustomerQuoteStatusBadge status={quote.status} />
      </div>

      <div className="lg:text-right">
        {quote.quotedAmount != null ? (
          <span className="spec-readout text-sm font-semibold text-navy-900">
            {formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? quote.currency)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Pricing pending</span>
        )}
      </div>

      <CaretRight
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-sky-500 lg:right-1.5"
        aria-hidden="true"
      />
    </Link>
  );
}