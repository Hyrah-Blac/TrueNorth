import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Users,
  MapPin,
  CaretLeft,
  Airplane,
  Paperclip,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { QuoteStatusBadge } from "@/components/quote/QuoteStatusBadge";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { Button } from "@/components/shared/buttons/Button";
import { getMyQuoteById } from "@/features/quote/lib/getQuotes";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { NotFoundError, ForbiddenError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Quote Details" };

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;

  let quote;
  try {
    quote = await getMyQuoteById(id);
  } catch (error) {
    if (isAppError(error) && (error instanceof NotFoundError || error instanceof ForbiddenError)) {
      notFound();
    }
    throw error;
  }

  const aircraftName = typeof quote.aircraftPreference === "object" && quote.aircraftPreference
    ? quote.aircraftPreference.name
    : undefined;

  // Each of these is a boolean flag with an optional free-text detail field
  // on the schema — collapse them into one list so the "Special
  // requirements" card only renders the ones actually flagged, instead of
  // five near-identical conditional blocks.
  const requirements = [
    { flagged: quote.hasMedicalEquipment, label: "Medical equipment", detail: quote.medicalEquipmentDetails },
    { flagged: quote.hasVipRequirements, label: "VIP requirements", detail: quote.vipRequirementsDetails },
    { flagged: quote.hasCargo, label: "Cargo", detail: quote.cargoDetails },
    { flagged: quote.hasPets, label: "Pets", detail: quote.petsDetails },
    { flagged: quote.hasDangerousGoods, label: "Dangerous goods", detail: quote.dangerousGoodsDetails },
  ].filter((item) => item.flagged);

  const hasBudgetRange = quote.budgetRangeMin != null || quote.budgetRangeMax != null;

  return (
    <div>
      <Link
        href="/dashboard/quotes"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 transition-colors hover:text-white"
      >
        <CaretLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to quotes
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="spec-readout text-sm text-slate-400">{quote.quoteNumber}</p>
                <h2 className="mt-1 font-editorial text-2xl font-light text-white">
                  {quote.departureAirportCode} → {quote.destinationAirportCode}
                </h2>
              </div>
              <QuoteStatusBadge status={quote.status} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                {formatDate(quote.departureDate)}
                {quote.isRoundTrip && quote.returnDate ? ` – ${formatDate(quote.returnDate)}` : null}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Users className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                {quote.passengerCount} passengers
              </div>
              {aircraftName ? (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                  {aircraftName}
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Airplane className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                {quote.missionType.replace(/_/g, " ")}
                {quote.isRoundTrip ? " · Round trip" : " · One way"}
              </div>
            </div>

            {hasBudgetRange ? (
              <div className="mt-6 border-t border-white/10 pt-6 text-sm text-slate-300">
                <span className="font-medium text-white">Budget range: </span>
                {quote.budgetRangeMin != null ? formatCurrency(quote.budgetRangeMin, quote.currency) : "—"}
                {" – "}
                {quote.budgetRangeMax != null ? formatCurrency(quote.budgetRangeMax, quote.currency) : "—"}
              </div>
            ) : null}

            {quote.specialRequests ? (
              <div className="mt-6 rounded-md bg-white/5 p-4 text-sm text-slate-300">
                <span className="font-medium text-white">Special requests: </span>
                {quote.specialRequests}
              </div>
            ) : null}
          </div>

          {requirements.length > 0 ? (
            <div className="glass-panel rounded-xl p-7">
              <h3 className="font-display text-base font-semibold text-white">Special requirements</h3>
              <ul className="mt-5 space-y-4">
                {requirements.map((item) => (
                  <li key={item.label} className="flex gap-3 text-sm text-slate-300">
                    <Warning className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
                    <div>
                      <span className="font-medium text-white">{item.label}</span>
                      {item.detail ? <p className="mt-0.5 text-slate-400">{item.detail}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {quote.attachments.length > 0 ? (
            <div className="glass-panel rounded-xl p-7">
              <h3 className="font-display text-base font-semibold text-white">Attachments</h3>
              <ul className="mt-5 space-y-2.5">
                {quote.attachments.map((attachment) => (
                  <li key={attachment.publicId}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-sky-400 transition-colors hover:text-sky-300"
                    >
                      <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {attachment.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="glass-panel h-fit rounded-xl p-7 lg:sticky lg:top-8">
          <h3 className="font-display text-base font-semibold text-white">Our response</h3>

          {quote.status === QUOTE_STATUSES.PENDING || quote.status === QUOTE_STATUSES.REVIEWING ? (
            <div className="mt-4">
              <InlineAlert tone="info">
                We&apos;re reviewing this request and will follow up with a quote shortly.
              </InlineAlert>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.APPROVED || quote.status === QUOTE_STATUSES.CONVERTED ? (
            <dl className="mt-4 space-y-2.5 border-b border-white/10 pb-4 text-sm">
              {quote.quotedAmount != null ? (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Quoted amount</dt>
                  <dd className="spec-readout font-semibold text-white">
                    {formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? quote.currency)}
                  </dd>
                </div>
              ) : null}
              {quote.validUntil ? (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Valid until</dt>
                  <dd className="spec-readout font-medium text-white">{formatDate(quote.validUntil)}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {quote.status === QUOTE_STATUSES.APPROVED && quote.convertedBooking == null ? (
            <div className="mt-4">
              <Button href="/contact" variant="outline" className="w-full justify-center">
                Proceed with this quote
              </Button>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.CONVERTED && quote.convertedBooking ? (
            <div className="mt-4">
              <InlineAlert tone="success">This quote has been converted into a booking.</InlineAlert>
              <Button
                href={`/dashboard/bookings/${quote.convertedBooking}`}
                variant="outline"
                className="mt-3 w-full justify-center"
              >
                View booking
              </Button>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.REJECTED ? (
            <div className="mt-4">
              <InlineAlert tone="danger">
                {quote.rejectionReason ?? "This quote request was not approved."}
              </InlineAlert>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.EXPIRED ? (
            <div className="mt-4">
              <InlineAlert tone="neutral">
                This quote has expired. Submit a new charter request to get an updated quote.
              </InlineAlert>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}