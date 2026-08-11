import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Warning, Paperclip, CheckCircle, ClockCountdown, Info } from "@phosphor-icons/react/dist/ssr";
import { CustomerQuoteStatusBadge } from "@/components/quote/CustomerQuoteStatusBadge";
import { QuoteDecisionPanel } from "@/components/quote/QuoteDecisionPanel";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { Button } from "@/components/shared/buttons/Button";
import { WrongAccountNotice } from "@/components/shared/WrongAccountNotice";
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
    // A ForbiddenError here means the quote exists but belongs to a
    // different account than the one currently signed in — most often
    // someone clicking an email link while signed in with the "wrong"
    // of two accounts. That's a recoverable, self-service situation,
    // so it gets its own screen rather than being folded into the
    // generic "not found" page a truly missing/invalid id gets.
    if (isAppError(error) && error instanceof ForbiddenError) {
      return <WrongAccountNotice resourceLabel="quote" />;
    }
    if (isAppError(error) && error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const aircraftName =
    typeof quote.aircraftPreference === "object" && quote.aircraftPreference
      ? quote.aircraftPreference.name
      : undefined;

  const selectedAircraft =
    typeof quote.selectedAircraft === "object" && quote.selectedAircraft ? quote.selectedAircraft : undefined;

  const isPastValidity = Boolean(quote.validUntil && new Date(quote.validUntil).getTime() < Date.now());
  const canDecide = quote.status === QUOTE_STATUSES.APPROVED && !isPastValidity;
  const isApproved = quote.status === QUOTE_STATUSES.APPROVED;
  const isPending = quote.status === QUOTE_STATUSES.PENDING || quote.status === QUOTE_STATUSES.REVIEWING;
  const hasPricingInfo = quote.status === QUOTE_STATUSES.APPROVED || quote.status === QUOTE_STATUSES.CONVERTED;

  const requirements = [
    { flagged: quote.hasMedicalEquipment, label: "Medical equipment", detail: quote.medicalEquipmentDetails },
    { flagged: quote.hasVipRequirements, label: "VIP requirements", detail: quote.vipRequirementsDetails },
    { flagged: quote.hasCargo, label: "Cargo", detail: quote.cargoDetails },
    { flagged: quote.hasPets, label: "Pets", detail: quote.petsDetails },
    { flagged: quote.hasDangerousGoods, label: "Dangerous goods", detail: quote.dangerousGoodsDetails },
  ].filter((item) => item.flagged);

  const hasBudgetRange = quote.budgetRangeMin != null || quote.budgetRangeMax != null;

  return (
    <div className="max-w-5xl space-y-8">
      <Button
        href="/dashboard/quotes"
        variant="ghost"
        size="sm"
        className="-ml-3 text-slate-500 hover:text-navy-900"
      >
        &lt; All quotes
      </Button>

      {/* Header — the document's masthead */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-7">
        <div className="min-w-0">
          <p className="spec-readout text-xs font-medium uppercase tracking-widest text-slate-400">
            {quote.quoteNumber}
          </p>
          <h1 className="mt-2 break-words font-editorial text-2xl font-light tracking-tight text-navy-900 sm:text-3xl">
            {quote.departureAirportCode} <span className="text-slate-300">→</span> {quote.destinationAirportCode}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
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

      {/* Status strips — a thin colored accent, not a boxed alert */}
      {isApproved && !isPastValidity ? (
        <div className="flex flex-wrap items-start gap-4 rounded-lg border-l-4 border-green-500 bg-green-50/60 px-5 py-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-green-800">Your charter quote is ready to review.</p>
            <p className="mt-0.5 text-sm text-green-700">
              Accept to create your booking and proceed to payment. Accepting does not charge you.
            </p>
          </div>
          {quote.validUntil ? (
            <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-green-700">
              <ClockCountdown className="h-4 w-4" aria-hidden="true" />
              Valid until {formatDate(quote.validUntil)}
            </div>
          ) : null}
        </div>
      ) : null}

      {isPending ? (
        <div className="flex items-start gap-3 rounded-lg border-l-4 border-sky-400 bg-sky-50/60 px-5 py-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
          <div>
            <p className="font-medium text-sky-800">We&apos;re preparing your quote.</p>
            <p className="mt-0.5 text-sm text-sky-700">
              Our operations team is reviewing your request. We&apos;ll be in touch shortly with aircraft options
              and pricing.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr,1fr] lg:gap-10">
        {/* Left: one flowing document, sections divided by hairlines instead of boxed cards */}
        <div className="divide-y divide-slate-100">
          <section className="pb-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Trip details</h2>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Route</dt>
                <dd className="mt-1.5 font-editorial text-base font-light text-navy-900">
                  {quote.departureAirportCode} <span className="text-slate-300">→</span> {quote.destinationAirportCode}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {quote.isRoundTrip ? "Dates" : "Date"}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {formatDate(quote.departureDate)}
                  {quote.isRoundTrip && quote.returnDate ? <> — {formatDate(quote.returnDate)}</> : null}
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
                <dd className="mt-1.5 text-sm font-medium capitalize text-navy-900">
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
              <div className="mt-6 border-t border-slate-100 pt-5">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Budget range</dt>
                <dd className="mt-1.5 text-sm text-slate-600">
                  {quote.budgetRangeMin != null ? formatCurrency(quote.budgetRangeMin, quote.currency) : "—"}
                  {" – "}
                  {quote.budgetRangeMax != null ? formatCurrency(quote.budgetRangeMax, quote.currency) : "—"}
                </dd>
              </div>
            ) : null}

            {quote.specialRequests ? (
              <blockquote className="mt-6 border-l-2 border-slate-200 pl-4 text-sm leading-relaxed text-slate-600">
                {quote.specialRequests}
              </blockquote>
            ) : null}
          </section>

          {requirements.length > 0 ? (
            <section className="py-7">
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
            </section>
          ) : null}

          {quote.attachments.length > 0 ? (
            <section className="py-7">
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
            </section>
          ) : null}
        </div>

        {/* Right: the one deliberate panel — proposal + decision, styled like a
            boarding-pass stub with a gold accent, since this is the sole spot
            that should carry visual weight on the page. */}
        <aside className="h-fit space-y-5 lg:sticky lg:top-28">
          {(hasPricingInfo && (selectedAircraft || quote.quotedAmount != null)) || canDecide ? (
            <div className="rounded-2xl border border-slate-200 border-t-2 border-t-gold-500 bg-slate-50/60 p-6">
              {hasPricingInfo && (selectedAircraft || quote.quotedAmount != null) ? (
                <>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Charter proposal
                  </h3>

                  {selectedAircraft ? (
                    <div className="mt-5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Aircraft</p>
                      <p className="mt-1.5 font-editorial text-lg font-light text-navy-900">{selectedAircraft.name}</p>
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
                    <div className={selectedAircraft ? "mt-6 border-t border-dashed border-slate-300 pt-5" : "mt-5"}>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total price</p>
                      <p className="spec-readout mt-1.5 text-2xl font-bold text-navy-900">
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
                </>
              ) : null}

              {canDecide ? (
                <div className="mt-6 border-t border-dashed border-slate-300 pt-5">
                  <QuoteDecisionPanel quoteId={quote._id} quoteNumber={quote.quoteNumber} />
                </div>
              ) : null}

              {quote.status === QUOTE_STATUSES.CONVERTED && quote.convertedBooking ? (
                <div className="mt-6 space-y-3 border-t border-dashed border-slate-300 pt-5">
                  <InlineAlert tone="success">You accepted this quote — your booking is ready.</InlineAlert>
                  <Button
                    href={`/dashboard/bookings/${quote.convertedBooking}`}
                    variant="primary"
                    className="w-full justify-center"
                  >
                    View Booking &amp; Payment
                  </Button>
                </div>
              ) : null}

              {quote.status === QUOTE_STATUSES.APPROVED && isPastValidity ? (
                <div className="mt-6 space-y-3 border-t border-dashed border-slate-300 pt-5">
                  <InlineAlert tone="neutral">
                    This quote&apos;s validity window has passed. Submit a new request for updated pricing.
                  </InlineAlert>
                  <Button href="/request-charter" variant="outline" className="w-full justify-center">
                    New Charter Request
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.REJECTED ? (
            <div className="space-y-3">
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
            <div className="space-y-3">
              <InlineAlert tone="neutral">This quote has expired. Submit a new request for updated pricing.</InlineAlert>
              <Button href="/request-charter" variant="outline" className="w-full justify-center">
                New Charter Request
              </Button>
            </div>
          ) : null}

          {isPending ? (
            <InlineAlert tone="info">We&apos;re reviewing this request. You&apos;ll hear from us shortly.</InlineAlert>
          ) : null}
        </aside>
      </div>
    </div>
  );
}