import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { formatDate } from "@/utils/date";
import type { IQuote } from "@/types/quote";

export function QuoteCard({ quote }: { quote: IQuote }) {
  return (
    <Link
      href={`/dashboard/quotes/${quote._id}`}
      className="group flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lifted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="spec-readout text-sm font-medium text-navy-900">{quote.quoteNumber}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {quote.departureAirportCode} → {quote.destinationAirportCode}
            </p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(quote.departureDate)}</p>
          </div>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500"
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <QuoteStatusBadge status={quote.status} />
        {quote.quotedAmount ? (
          <p className="spec-readout text-sm font-semibold text-navy-900">
            {quote.quotedAmount.toLocaleString()} {quote.quotedCurrency}
          </p>
        ) : (
          <p className="text-xs text-slate-400">Awaiting quote</p>
        )}
      </div>
    </Link>
  );
}
