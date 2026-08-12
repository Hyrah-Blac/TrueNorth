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

  const wasRegisteredCustomer = quote.customer !== undefined;
  const customerLabel = customer
    ? ""
    : wasRegisteredCustomer
      ? " (deleted account)"
      : " (guest)";

  return (
    <Link
      href={`/admin/quotes/${quote._id}`}
      className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 transition-all duration-300 hover:border-sky-200 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Left — icon + identity */}
      <div className="flex items-center gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
          style={{
            background: "linear-gradient(135deg, rgb(219 229 247) 0%, rgb(189 205 241) 100%)",
            color: "rgb(30 58 128)",
            boxShadow: "0 1px 4px rgb(43 91 191 / 0.15)",
          }}
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <p className="spec-readout text-[11px] text-slate-400">{quote.quoteNumber}</p>
          <p className="mt-0.5 truncate font-editorial text-lg font-light text-navy-900 transition-colors group-hover:text-sky-700">
            {quote.contactInfo.fullName}
            {customerLabel}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span className="spec-readout">{quote.departureAirportCode} → {quote.destinationAirportCode}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>{formatDate(quote.departureDate)}</span>
          </div>
        </div>
      </div>

      {/* Right — status + caret */}
      <div className="flex shrink-0 items-center gap-4">
        <QuoteStatusBadge status={quote.status} />
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-500"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}