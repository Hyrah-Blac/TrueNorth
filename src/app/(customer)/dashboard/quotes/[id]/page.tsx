import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Warning,
  Paperclip,
  CheckCircle,
  ClockCountdown,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import { CustomerQuoteStatusBadge } from "@/components/quote/CustomerQuoteStatusBadge";
import { QuoteDecisionPanel } from "@/components/quote/QuoteDecisionPanel";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { Button } from "@/components/shared/buttons/Button";
import { getMyQuoteById } from "@/features/quote/lib/getQuotes";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { NotFoundError, ForbiddenError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Charter Quote" };

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

  const aircraftName =
    typeof quote.aircraftPreference === "object" && quote.aircraftPreference
      ? quote.aircraftPreference.name
      : undefined;

  const selectedAircraft =
    typeof quote.selectedAircraft === "object" && quote.selectedAircraft
      ? quote.selectedAircraft
      : undefined;

  const isPastValidity = Boolean(
    quote.validUntil && new Date(quote.validUntil).getTime() < Date.now()
  );
  const canDecide = quote.status === QUOTE_STATUSES.APPROVED && !isPastValidity;
  const isApproved = quote.status === QUOTE_STATUSES.APPROVED;
  const isPending =
    quote.status === QUOTE_STATUSES.PENDING || quote.status === QUOTE_STATUSES.REVIEWING;
  const hasPricingInfo =
    quote.status === QUOTE_STATUSES.APPROVED || quote.status === QUOTE_STATUSES.CONVERTED;

  const requirements = [
    { flagged: quote.hasMedicalEquipment, label: "Medical equipment", detail: quote.medicalEquipmentDetails },
    { flagged: quote.hasVipRequirements, label: "VIP requirements", detail: quote.vipRequirementsDetails },
    { flagged: quote.hasCargo, label: "Cargo", detail: quote.cargoDetails },
    { flagged: quote.hasPets, label: "Pets", detail: quote.petsDetails },
    { flagged: quote.hasDangerousGoods, label: "Dangerous goods", detail: quote.dangerousGoodsDetails },
  ].filter((item) => item.flagged);

  const hasBudgetRange = quote.budgetRangeMin != null || quote.budgetRangeMax != null;

  return (
    <div className="space-y-6">
      {/* Back nav + header */}
      <div>
        <div className="mb-4">
          <Button href="/dashboard/quotes" variant="ghost" size="sm" className="-ml-3 text-slate-500 hover:text-navy-900">
            ← All quotes
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="spec-readout text-xs font-medium uppercase tracking-widest text-slate-400">
              {quote.quoteNumber}
            </p>
            <h1 className="mt-1.5 font-editorial text-3xl font-light tracking-tight text-navy-900">
              {quote.departureAirportCode}{" "}
              <span className="text-slate-400">→</span>{" "}
              {quote.destinationAirportCode}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(quote.departureDate)}
              {quote.isRoundTrip && quote.returnDate ? ` — ${formatDate(quote.returnDate)}` : ""}
              {" · "}
              {quote.passengerCount} {quote.passengerCount === 1 ? "passenger" : "passengers"}
              {" · "}
              {quote.isRoundTrip ? "Round trip" : "One way"}
            </p>
          </div>
          <CustomerQuoteStatusBadge status={quote.status} />
        </div>
      </div>

      {/* Approved: attention banner */}
      {isApproved && !isPastValidity ? (
        <div className="flex flex-wrap items-start gap-4 rounded-xl border border-green-300 bg-green-50 px-6 py-5">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Your charter quote is ready to review.</p>
            <p className="mt-0.5 text-sm text-green-700">
              Accept to create your booking and proceed to payment. Accepting does not charge you.
            </p>
          </div>
          {quote.validUntil ? (
            <div className="flex items-center gap-1.5 text-sm text-green-700 whitespace-nowrap">
              <ClockCountdown className="h-4 w-4" aria-hidden="true" />
              Valid until {formatDate(quote.validUntil)}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Pending: context banner */}
      {isPending ? (
        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-6 py-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
          <div>
            <p className="font-medium text-sky-800">We&apos;re preparing your quote.</p>
            <p className="mt-0.5 text-sm text-sky-700">
              Our operations team is reviewing your request. We&apos;ll be in touch shortly with aircraft options and pricing.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* Left: trip details */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Trip details
            </h2>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Route</dt>
                <dd className="mt-1.5 font-display text-lg font-medium text-navy-900">
                  {quote.departureAirportCode} → {quote.destinationAirportCode}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {quote.isRoundTrip ? "Dates" : "Date"}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {formatDate(quote.departureDate)}
                  {quote.isRoundTrip && quote.returnDate ? (
                    <> — {formatDate(quote.returnDate)}</>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Passengers</dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {quote.passengerCount} {quote.passengerCount === 1 ? "passenger" : "passengers"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Flight type</dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900 capitalize">
                  {quote.missionType.replace(/_/g, " ")} · {quote.isRoundTrip ? "Round trip" : "One way"}
                </dd>
              </div>
              {aircraftName ? (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Aircraft preference
                  </dt>
                  <dd className="mt-1.5 text-sm text-slate-600">
                    {aircraftName}
                    <span className="ml-2 text-xs text-slate-400">(preference only — final selection by our team)</span>
                  </dd>
                </div>
              ) : null}
            </dl>

            {hasBudgetRange ? (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Budget range</dt>
                <dd className="mt-1.5 text-sm text-slate-600">
                  {quote.budgetRangeMin != null ? formatCurrency(quote.budgetRangeMin, quote.currency) : "—"}
                  {" – "}
                  {quote.budgetRangeMax != null ? formatCurrency(quote.budgetRangeMax, quote.currency) : "—"}
                </dd>
              </div>
            ) : null}

            {quote.specialRequests ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Special requests</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{quote.specialRequests}</p>
              </div>
            ) : null}
          </div>

          {requirements.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Special requirements
              </h2>
              <ul className="mt-4 space-y-3">
                {requirements.map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <Warning className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
                    <div className="text-sm">
                      <span className="font-medium text-navy-900">{item.label}</span>
                      {item.detail ? <p className="mt-0.5 text-slate-500">{item.detail}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {quote.attachments.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attachments</h2>
              <ul className="mt-4 space-y-2.5">
                {quote.attachments.map((attachment) => (
                  <li key={attachment.publicId}>
                    <a
                      href={attachment.viewUrl}
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

        {/* Right: proposal + decision */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-28">
          {hasPricingInfo && (selectedAircraft || quote.quotedAmount != null) ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Charter proposal
              </h3>

              {selectedAircraft ? (
                <div className="mt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Aircraft</p>
                  <p className="mt-1.5 font-display text-xl font-medium text-navy-900">{selectedAircraft.name}</p>
                  <p className="text-sm text-slate-500">
                    {selectedAircraft.manufacturer} {selectedAircraft.model}
                  </p>
                  {selectedAircraft.registration ? (
                    <p className="spec-readout mt-0.5 text-xs text-slate-400">
                      Reg: {selectedAircraft.registration}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-slate-500">
                    Up to {selectedAircraft.passengerCapacity} passengers
                  </p>
                </div>
              ) : null}

              {quote.quotedAmount != null ? (
                <div className={selectedAircraft ? "mt-6 border-t border-slate-100 pt-5" : "mt-5"}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Total price
                  </p>
                  <p className="spec-readout mt-1.5 text-3xl font-bold text-navy-900">
                    {formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? quote.currency)}
                  </p>
                  {quote.validUntil ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <ClockCountdown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Quote valid until {formatDate(quote.validUntil)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {canDecide ? (
            <div className="rounded-xl border border-green-300 bg-white p-6 shadow-soft">
              <QuoteDecisionPanel quoteId={quote._id} quoteNumber={quote.quoteNumber} />
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.APPROVED && isPastValidity ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
              <InlineAlert tone="neutral">
                This quote&apos;s validity window has passed. Submit a new request for updated pricing.
              </InlineAlert>
              <Button href="/request-charter" variant="outline" className="w-full justify-center">
                New Charter Request
              </Button>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.CONVERTED && quote.convertedBooking ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
              <InlineAlert tone="success">
                You accepted this quote — your booking is ready.
              </InlineAlert>
              <Button
                href={`/dashboard/bookings/${quote.convertedBooking}`}
                variant="primary"
                className="w-full justify-center"
              >
                View Booking &amp; Payment
              </Button>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.REJECTED ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
              <InlineAlert tone="danger">
                {quote.rejectionReason ??
                  "This charter wasn't available. Please reach out to our team if you'd like to explore alternatives."}
              </InlineAlert>
              <Button href="/request-charter" variant="outline" className="w-full justify-center">
                Submit New Request
              </Button>
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.EXPIRED ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
              <InlineAlert tone="neutral">
                This quote has expired. Submit a new request for updated pricing.
              </InlineAlert>
              <Button href="/request-charter" variant="outline" className="w-full justify-center">
                New Charter Request
              </Button>
            </div>
          ) : null}

          {isPending ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
              <InlineAlert tone="info">
                We&apos;re reviewing this request. You&apos;ll hear from us shortly.
              </InlineAlert>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}