import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { formatDate } from "@/utils/date";
import type { IQuote } from "@/types/quote";

/**
 * Stripe-dashboard-style table for larger screens. QuoteCard continues to
 * handle the mobile (< md) view.
 */
export function QuotesTable({ quotes }: { quotes: IQuote[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft md:block">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-widest2 text-slate-500">
            <th scope="col" className="px-6 py-4 font-medium">Quote</th>
            <th scope="col" className="px-6 py-4 font-medium">Route</th>
            <th scope="col" className="px-6 py-4 font-medium">Departure</th>
            <th scope="col" className="px-6 py-4 font-medium">Status</th>
            <th scope="col" className="px-6 py-4 text-right font-medium">Quoted</th>
            <th scope="col" className="w-10 px-4 py-4" aria-hidden="true" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {quotes.map((quote) => (
            <tr key={quote._id} className="group transition-colors hover:bg-sky-500/[0.04]">
              <td className="px-6 py-4">
                <Link
                  href={`/dashboard/quotes/${quote._id}`}
                  className="spec-readout text-sm font-medium text-navy-900 transition-colors group-hover:text-sky-600"
                >
                  {quote.quoteNumber}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {quote.departureAirportCode} → {quote.destinationAirportCode}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{formatDate(quote.departureDate)}</td>
              <td className="px-6 py-4">
                <QuoteStatusBadge status={quote.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <span className="spec-readout text-sm font-semibold text-navy-900">
                  {quote.quotedAmount ? `${quote.quotedAmount.toLocaleString()} ${quote.quotedCurrency}` : "—"}
                </span>
              </td>
              <td className="px-4 py-4">
                <Link href={`/dashboard/quotes/${quote._id}`} aria-label={`View quote ${quote.quoteNumber}`}>
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
  );
}
