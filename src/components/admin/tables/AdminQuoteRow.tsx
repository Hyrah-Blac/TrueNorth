import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";
import { QuoteStatusBadge } from "@/components/quote/QuoteStatusBadge";
import { formatDate } from "@/utils/date";
import type { IQuote } from "@/types/quote";

export function AdminQuoteRow({ quote }: { quote: IQuote }) {
  const customer =
    typeof quote.customer === "object" && quote.customer !== null
      ? (quote.customer as unknown as { firstName?: string; lastName?: string })
      : null;

  // Mongoose populate distinguishes these two cases: a ref that was never
  // set comes back `undefined` (a true guest submission), while a ref that
  // pointed at a now-deleted User comes back `null`. Don't collapse them
  // into the same "(guest)" label — a deleted customer's quote isn't a
  // guest submission and shouldn't read like one.
  const wasRegisteredCustomer = quote.customer !== undefined;
  const customerLabel = customer
    ? ""
    : wasRegisteredCustomer
      ? " (deleted account)"
      : " (guest)";

  return (
    <Link
      href={`/admin/quotes/${quote._id}`}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:border-sky-300 hover:shadow-lifted sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="spec-readout text-sm font-medium text-navy-900">{quote.quoteNumber}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {quote.contactInfo.fullName}
            {customerLabel} · {quote.departureAirportCode} → {quote.destinationAirportCode}
          </p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(quote.departureDate)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <QuoteStatusBadge status={quote.status} />
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
      </div>
    </Link>
  );
}