import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CustomerQuoteStatusBadge } from "./CustomerQuoteStatusBadge";
import { formatDate } from "@/utils/date";
import type { IQuote } from "@/types/quote";

/**
 * Stripe-dashboard-style table for larger screens. QuoteCard continues to
 * handle the mobile (< md) view.
 *
 * The table scrolls horizontally on its own (rather than being silently
 * clipped by the card's overflow-hidden) any time the viewport is too
 * narrow to fit every column, and the least critical column (Departure)
 * drops off first so a tablet-width screen rarely needs to scroll at all.
 */
export function QuotesTable({ quotes }: { quotes: IQuote[] }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-widest2 text-slate-500">
              <th scope="col" className="px-6 py-4 font-medium">
                Quote
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Route
              </th>
              <th scope="col" className="hidden px-6 py-4 font-medium lg:table-cell">
                Departure
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-right font-medium">
                Quoted
              </th>
              <th scope="col" className="w-10 px-4 py-4" aria-hidden="true" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <tr
                key={quote._id}
                className="group relative cursor-pointer transition-colors hover:bg-sky-500/[0.04]"
              >
                <td className="relative px-6 py-4">
                  <Link
                    href={`/dashboard/quotes/${quote._id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View quote ${quote.quoteNumber}`}
                    tabIndex={-1}
                  />
                  <span className="spec-readout relative z-10 text-sm font-medium text-navy-900 transition-colors group-hover:text-sky-600">
                    {quote.quoteNumber}
                  </span>
                </td>
                <td className="relative z-10 whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {quote.departureAirportCode} → {quote.destinationAirportCode}
                </td>
                <td className="relative z-10 hidden whitespace-nowrap px-6 py-4 text-sm text-slate-600 lg:table-cell">
                  {formatDate(quote.departureDate)}
                </td>
                <td className="relative z-10 px-6 py-4">
                  <CustomerQuoteStatusBadge status={quote.status} />
                </td>
                <td className="relative z-10 whitespace-nowrap px-6 py-4 text-right">
                  <span className="spec-readout text-sm font-semibold text-navy-900">
                    {quote.quotedAmount ? `${quote.quotedAmount.toLocaleString()} ${quote.quotedCurrency}` : "—"}
                  </span>
                </td>
                <td className="relative z-10 px-4 py-4">
                  <Link
                    href={`/dashboard/quotes/${quote._id}`}
                    aria-label={`View quote ${quote.quoteNumber}`}
                    tabIndex={-1}
                  >
                    <ArrowUpRight
                      className="h-4 w-4 text-slate-300 transition-colors group-hover:text-sky-500"
                      aria-hidden="true"
                    />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}