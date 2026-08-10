import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CalendarBlank, Users } from "@phosphor-icons/react/dist/ssr";
import { CustomerQuoteStatusBadge } from "./CustomerQuoteStatusBadge";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { IQuote } from "@/types/quote";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";

export function QuoteCard({ quote }: { quote: IQuote }) {
  const needsAction = quote.status === QUOTE_STATUSES.APPROVED;
  const isRejected = quote.status === QUOTE_STATUSES.REJECTED || quote.status === QUOTE_STATUSES.EXPIRED;

  return (
    <Link
      href={`/dashboard/quotes/${quote._id}`}
      className={`group relative flex flex-col gap-0 overflow-hidden rounded-xl border bg-white shadow-soft transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:shadow-lifted ${
        needsAction
          ? "border-green-400/60 ring-1 ring-green-400/30"
          : isRejected
          ? "border-slate-200 opacity-75"
          : "border-slate-200 hover:border-sky-200"
      }`}
    >
      {/* Action-needed banner for approved quotes */}
      {needsAction ? (
        <div className="flex items-center gap-2 border-b border-green-200 bg-green-50 px-5 py-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <p className="text-[11px] font-medium uppercase tracking-wide text-green-700">
            Your quote is ready — review &amp; accept
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="spec-readout text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {quote.quoteNumber}
            </p>
            <p className="mt-0.5 font-display text-base font-medium text-navy-900">
              {quote.departureAirportCode}{" "}
              <span className="text-slate-400">→</span>{" "}
              {quote.destinationAirportCode}
            </p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500 mt-1"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CalendarBlank className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(quote.departureDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {quote.passengerCount} {quote.passengerCount === 1 ? "passenger" : "passengers"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <CustomerQuoteStatusBadge status={quote.status} />
          {quote.quotedAmount ? (
            <p className="spec-readout text-sm font-semibold text-navy-900">
              {formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? "KES")}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">Pricing in progress</p>
          )}
        </div>
      </div>
    </Link>
  );
}