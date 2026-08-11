import Link from "next/link";
import { CalendarBlank, Users } from "@phosphor-icons/react/dist/ssr";
import { CustomerQuoteStatusBadge } from "./CustomerQuoteStatusBadge";
import { formatDate } from "@/utils/date";
import type { IQuote } from "@/types/quote";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";

/**
 * One row, every breakpoint. Below lg it stacks (route, then a meta line,
 * then price). At lg+ it becomes a defined grid — route / date /
 * passengers / status / price each get a fixed column, so the row reads
 * as evenly distributed rather than one loose flex block with a large
 * gap before the price.
 */
export function QuoteRow({ quote }: { quote: IQuote }) {
  const needsAction = quote.status === QUOTE_STATUSES.APPROVED;

  return (
    <Link
      href={`/dashboard/quotes/${quote._id}`}
      className="-mx-3 flex flex-col gap-3 rounded-lg px-3 py-5 transition-colors hover:bg-sky-500/[0.035] lg:grid lg:grid-cols-[1fr_130px_64px_180px_120px] lg:items-center lg:gap-6"
    >
      <div className="min-w-0">
        <p className="spec-readout text-[11px] text-slate-400">{quote.quoteNumber}</p>
        <p className="mt-0.5 truncate font-editorial text-xl font-light text-navy-900">
          {quote.departureAirportCode} <span className="text-slate-300">→</span> {quote.destinationAirportCode}
        </p>
      </div>

      <span className="flex items-center gap-1.5 text-sm text-slate-500">
        <CalendarBlank className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {formatDate(quote.departureDate)}
      </span>

      <span className="flex items-center gap-1.5 text-sm text-slate-500">
        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {quote.passengerCount}
      </span>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <CustomerQuoteStatusBadge status={quote.status} />
        {needsAction ? (
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-green-600">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            Ready to review
          </span>
        ) : null}
      </div>

      <div className="lg:text-right">
        {quote.quotedAmount ? (
          <span className="spec-readout text-sm font-semibold text-navy-900">
            {quote.quotedAmount.toLocaleString()} {quote.quotedCurrency}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Pricing pending</span>
        )}
      </div>
    </Link>
  );
}