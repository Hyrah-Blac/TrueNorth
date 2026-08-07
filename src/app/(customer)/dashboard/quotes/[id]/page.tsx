import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Users, MapPin, Airplane, Paperclip, Warning } from "@phosphor-icons/react/dist/ssr";
import { DetailHeader } from "@/components/admin/layout/DetailHeader";
import { QuoteStatusBadge } from "@/components/quote/QuoteStatusBadge";
import { QuoteDecisionPanel } from "@/components/quote/QuoteDecisionPanel";
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

  // The aircraft actually assigned to the quote by the operations team,
  // distinct from the customer's original preference above. Only set once
  // a quote has been priced (approved or already converted to a booking).
  const selectedAircraft =
    typeof quote.selectedAircraft === "object" && quote.selectedAircraft ? quote.selectedAircraft : undefined;

  // Defensive, client-independent check in case the daily cleanup job
  // hasn't run yet — the server action re-checks this regardless, but the
  // UI shouldn't offer to accept something that's effectively expired.
  const isPastValidity = Boolean(quote.validUntil && new Date(quote.validUntil).getTime() < Date.now());
  const canDecide = quote.status === QUOTE_STATUSES.APPROVED && !isPastValidity;

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
      <DetailHeader
        variant="light"
        backHref="/dashboard/quotes"
        backLabel="Quotes"
        eyebrow={quote.quoteNumber}
        title={`${quote.departureAirportCode} → ${quote.destinationAirportCode}`}
        status={<QuoteStatusBadge status={quote.status} />}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {formatDate(quote.departureDate)}
                {quote.isRoundTrip && quote.returnDate ? ` – ${formatDate(quote.returnDate)}` : null}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {quote.passengerCount} passengers
              </div>
              {aircraftName ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  {aircraftName}
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Airplane className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {quote.missionType.replace(/_/g, " ")}
                {quote.isRoundTrip ? " · Round trip" : " · One way"}
              </div>
            </div>

            {hasBudgetRange ? (
              <div className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-600">
                <span className="font-medium text-navy-900">Budget range: </span>
                {quote.budgetRangeMin != null ? formatCurrency(quote.budgetRangeMin, quote.currency) : "—"}
                {" – "}
                {quote.budgetRangeMax != null ? formatCurrency(quote.budgetRangeMax, quote.currency) : "—"}
              </div>
            ) : null}

            {quote.specialRequests ? (
              <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-medium text-navy-900">Special requests: </span>
                {quote.specialRequests}
              </div>
            ) : null}
          </div>

          {requirements.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
              <h3 className="font-display text-base font-semibold text-navy-900">Special requirements</h3>
              <ul className="mt-5 space-y-4">
                {requirements.map((item) => (
                  <li key={item.label} className="flex gap-3 text-sm text-slate-600">
                    <Warning className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
                    <div>
                      <span className="font-medium text-navy-900">{item.label}</span>
                      {item.detail ? <p className="mt-0.5 text-slate-500">{item.detail}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {quote.attachments.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
              <h3 className="font-display text-base font-semibold text-navy-900">Attachments</h3>
              <ul className="mt-5 space-y-2.5">
                {quote.attachments.map((attachment) => (
                  <li key={attachment.publicId}>
                    
                     <a href={attachment.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-sky-600 transition-colors hover:text-sky-700"
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

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-7 shadow-soft lg:sticky lg:top-28">
          <h3 className="font-display text-base font-semibold text-navy-900">Our response</h3>

          {quote.status === QUOTE_STATUSES.PENDING || quote.status === QUOTE_STATUSES.REVIEWING ? (
            <div className="mt-4">
              <InlineAlert tone="info">
                We&apos;re reviewing this request and will follow up with a quote shortly.
              </InlineAlert>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.APPROVED || quote.status === QUOTE_STATUSES.CONVERTED ? (
            <>
              {selectedAircraft ? (
                <div className="mt-4 space-y-2.5 border-b border-slate-100 pb-4 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Aircraft</p>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Aircraft</dt>
                    <dd className="text-right font-medium text-navy-900">{selectedAircraft.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Manufacturer / model</dt>
                    <dd className="text-right font-medium text-navy-900">
                      {selectedAircraft.manufacturer} {selectedAircraft.model}
                    </dd>
                  </div>
                  {selectedAircraft.registration ? (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Registration</dt>
                      <dd className="spec-readout text-right font-medium text-navy-900">
                        {selectedAircraft.registration}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Passenger capacity</dt>
                    <dd className="text-right font-medium text-navy-900">
                      {selectedAircraft.passengerCapacity}
                    </dd>
                  </div>
                </div>
              ) : null}

              <dl className="mt-4 space-y-2.5 border-b border-slate-100 pb-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pricing</p>
                {quote.quotedAmount != null ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Quoted amount</dt>
                    <dd className="spec-readout font-semibold text-navy-900">
                      {formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? quote.currency)}
                    </dd>
                  </div>
                ) : null}
                {quote.validUntil ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Valid until</dt>
                    <dd className="spec-readout font-medium text-navy-900">{formatDate(quote.validUntil)}</dd>
                  </div>
                ) : null}
              </dl>
            </>
          ) : null}

          {quote.status === QUOTE_STATUSES.APPROVED && isPastValidity ? (
            <div className="mt-4">
              <InlineAlert tone="neutral">
                This quote&apos;s validity window has passed. Please request an updated quote.
              </InlineAlert>
            </div>
          ) : null}

          {canDecide ? (
            <div className="mt-4">
              <QuoteDecisionPanel quoteId={quote._id} quoteNumber={quote.quoteNumber} />
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