import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Warning, Paperclip, CheckCircle, Info, Airplane, CaretLeft, SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import { CustomerQuoteStatusBadge } from "@/components/quote/CustomerQuoteStatusBadge";
import { QuoteDecisionPanel } from "@/components/quote/QuoteDecisionPanel";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { Button } from "@/components/shared/buttons/Button";
import { WrongAccountNotice } from "@/components/shared/WrongAccountNotice";
import { getMyQuoteById } from "@/features/quote/lib/getQuotes";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { requireAuth } from "@/middleware/auth";
import { checkUserRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
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

  // Cheap: reads the already-verified session claims, no extra network
  // call. Keyed per-account rather than per-IP since the concern is one
  // signed-in account probing many ids, not shared-network traffic.
  const { clerkId } = await requireAuth();
  const rateLimit = checkUserRateLimit(clerkId, "quote-detail", RATE_LIMITS.DETAIL_PAGE_LOOKUP);
  if (!rateLimit.allowed) {
    // Fail closed into the same screen a genuinely missing id gets —
    // no additional signal leaks from being rate limited.
    notFound();
  }

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

  // Hide the manufacturer/model line when it just repeats the aircraft name
  // (e.g. "Cessna Citation XLS+" shown twice).
  const aircraftSubline = selectedAircraft
    ? `${selectedAircraft.manufacturer ?? ""} ${selectedAircraft.model ?? ""}`.trim()
    : "";
  const showAircraftSubline =
    Boolean(selectedAircraft) && aircraftSubline !== "" && aircraftSubline.toLowerCase() !== selectedAircraft!.name.toLowerCase();

  const hasBudgetRange = quote.budgetRangeMin != null || quote.budgetRangeMax != null;

  // Real airport names for display, resolved from the actual codes on the
  // quote — falls back to the raw code for any airport not in the
  // database rather than guessing at a name.
  const airportNames = await getAirportNamesByCodes([quote.departureAirportCode, quote.destinationAirportCode]);
  const departureInfo = airportNames[quote.departureAirportCode.toUpperCase()];
  const destinationInfo = airportNames[quote.destinationAirportCode.toUpperCase()];
  const departureName = departureInfo?.city ?? quote.departureAirportCode;
  const destinationName = destinationInfo?.city ?? quote.destinationAirportCode;

  // Presentation-only string, derived from real quote fields, for the
  // accept-confirmation dialog (plain text there, so it can't use
  // RouteDisplay directly).
  const routeLabel = `${departureName} (${quote.departureAirportCode}) \u2192 ${destinationName} (${quote.destinationAirportCode})${
    quote.isRoundTrip ? ` \u2192 ${departureName} (${quote.departureAirportCode})` : ""
  }`;
  const dateLabel = `${formatDate(quote.departureDate)}${quote.departureTime ? `, ${quote.departureTime}` : ""}${
    quote.isRoundTrip && quote.returnDate ? ` \u2014 ${formatDate(quote.returnDate)}` : ""
  }`;
  const passengerLabel = `${quote.passengerCount} ${quote.passengerCount === 1 ? "passenger" : "passengers"}`;
  const priceLabel =
    quote.quotedAmount != null ? formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? quote.currency) : undefined;

  return (
    <div className="space-y-6">
      {/* Header — same structure as the booking detail page */}
      <div>
        <div className="mb-3">
          <Button href="/dashboard/quotes" variant="ghost" size="sm" className="-ml-3 gap-1 text-xs text-navy-900/70 hover:text-navy-900">
            <CaretLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All quotes
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="spec-readout text-[10px] font-medium uppercase tracking-[0.2em] text-navy-900/60">
              Charter proposal · {quote.quoteNumber}
            </p>
            <RouteDisplay
              className="mt-1.5"
              size="md"
              departure={{ code: quote.departureAirportCode, name: departureInfo }}
              destination={{ code: quote.destinationAirportCode, name: destinationInfo }}
              isRoundTrip={quote.isRoundTrip}
            />
            <p className="mt-1.5 text-xs text-navy-900/65">
              {formatDate(quote.departureDate)}
              {quote.departureTime ? `, ${quote.departureTime}` : ""}
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

      {/* Status banners — solid white cards (not translucent tints) so they
          stay readable over the background photo, like the booking banner. */}
      {isApproved && !isPastValidity ? (
        <div className="flex items-start gap-3.5 rounded-xl border border-navy-900/10 bg-white px-6 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-champagne-600" weight="fill" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy-900">Your charter proposal is ready to review.</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Accept to create your reservation and continue to payment. No payment is taken by accepting.
            </p>
          </div>
        </div>
      ) : null}

      {isPending ? (
        <div className="flex items-start gap-3.5 rounded-xl border border-sky-200 bg-white px-6 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" weight="fill" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-navy-900">We&apos;re preparing your proposal.</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Our operations team is reviewing your request. We&apos;ll be in touch shortly with aircraft options
              and pricing.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* Left: trip details, requirements, attachments — each in its own
            white card so nothing sits directly on the photo. Ordered after
            the proposal panel on mobile, as on the booking page. */}
        <div className="order-2 space-y-5 lg:order-1">
          <div className="rounded-xl border border-navy-900/10 bg-white p-6 sm:p-7">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Airplane className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
              Trip details
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5">
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Route</dt>
                <dd className="mt-1.5">
                  <RouteDisplay
                    size="sm"
                    departure={{ code: quote.departureAirportCode, name: departureInfo }}
                    destination={{ code: quote.destinationAirportCode, name: destinationInfo }}
                    isRoundTrip={quote.isRoundTrip}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  {quote.isRoundTrip ? "Dates" : "Date"}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {formatDate(quote.departureDate)}
                  {quote.isRoundTrip && quote.returnDate ? <> — {formatDate(quote.returnDate)}</> : null}
                </dd>
              </div>
              {quote.departureTime ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Departure time</dt>
                  <dd className="mt-1.5 text-sm font-medium text-navy-900">{quote.departureTime}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Passengers</dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {quote.passengerCount} {quote.passengerCount === 1 ? "passenger" : "passengers"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Flight type</dt>
                <dd className="mt-1.5 text-sm font-medium capitalize text-navy-900">
                  {quote.missionType.replace(/_/g, " ")} · {quote.isRoundTrip ? "Round trip" : "One way"}
                </dd>
              </div>
              {aircraftName ? (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Aircraft preference</dt>
                  <dd className="mt-1.5 text-sm font-medium text-navy-900">
                    {aircraftName}
                    <span className="ml-2 text-xs font-normal text-slate-500">(preference only — final selection by our team)</span>
                  </dd>
                </div>
              ) : null}
              {hasBudgetRange ? (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Budget range</dt>
                  <dd className="mt-1.5 text-sm font-medium text-navy-900">
                    {quote.budgetRangeMin != null ? formatCurrency(quote.budgetRangeMin, quote.currency) : "—"}
                    {" – "}
                    {quote.budgetRangeMax != null ? formatCurrency(quote.budgetRangeMax, quote.currency) : "—"}
                  </dd>
                </div>
              ) : null}
            </dl>

            {quote.specialRequests ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Special requests</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{quote.specialRequests}</p>
              </div>
            ) : null}
          </div>

          {requirements.length > 0 ? (
            <div className="rounded-xl border border-navy-900/10 bg-white p-6 sm:p-7">
              <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Warning className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
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
            <div className="rounded-xl border border-navy-900/10 bg-white p-6 sm:p-7">
              <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Paperclip className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
                Attachments
              </h2>
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

        {/* Right: proposal + decision panel */}
        <aside className="order-1 h-fit space-y-5 lg:order-2">
          {(hasPricingInfo && (selectedAircraft || quote.quotedAmount != null)) || canDecide ? (
            <div className="overflow-hidden rounded-xl border border-navy-900/10 bg-white">
              {hasPricingInfo && (selectedAircraft || quote.quotedAmount != null) ? (
                <div className="px-6 py-5 sm:px-7 sm:py-6">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
                    Charter proposal
                  </h3>

                  <div className="mt-4 flex flex-nowrap items-stretch gap-3 sm:gap-5">
                    {selectedAircraft ? (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900/5">
                            <Airplane className="h-3 w-3 text-navy-700" weight="fill" aria-hidden="true" />
                          </span>
                          <p className="truncate text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Your aircraft</p>
                        </div>
                        <p className="mt-1.5 truncate font-editorial text-lg font-light text-navy-900">
                          {selectedAircraft.name}
                        </p>
                        {showAircraftSubline ? (
                          <p className="truncate text-xs text-slate-500">{aircraftSubline}</p>
                        ) : null}
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          Up to {selectedAircraft.passengerCapacity} passengers
                        </p>
                      </div>
                    ) : null}

                    {selectedAircraft && quote.quotedAmount != null ? (
                      <div className="w-px shrink-0 self-stretch bg-navy-900/10" aria-hidden="true" />
                    ) : null}

                    {quote.quotedAmount != null ? (
                      <div className={selectedAircraft ? "shrink-0 text-right" : "flex-1"}>
                        <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Charter total</p>
                        <p className="font-editorial spec-readout mt-1.5 whitespace-nowrap text-xl font-semibold leading-tight text-navy-900 sm:text-2xl">
                          {priceLabel}
                        </p>
                        {quote.validUntil ? (
                          <p className="mt-1 whitespace-nowrap text-[11px] text-slate-500">
                            {isPastValidity ? "Was valid until" : "Valid until"} {formatDate(quote.validUntil)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {canDecide ? (
                <div
                  className={
                    hasPricingInfo && (selectedAircraft || quote.quotedAmount != null)
                      ? "border-t border-navy-900/10 px-6 py-5 sm:px-7 sm:py-6"
                      : "px-6 py-5 sm:px-7 sm:py-6"
                  }
                >
                  <h3 className="font-editorial text-lg font-light text-navy-900">Ready to proceed?</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your charter details and accept the proposal to continue to your reservation.
                  </p>
                  <div className="mt-4">
                    <QuoteDecisionPanel
                      quoteId={quote._id}
                      quoteNumber={quote.quoteNumber}
                      summary={{
                        route: routeLabel,
                        date: dateLabel,
                        passengers: passengerLabel,
                        aircraft: selectedAircraft?.name,
                        price: priceLabel,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {quote.status === QUOTE_STATUSES.CONVERTED && quote.convertedBooking ? (
                <div className="space-y-2 border-t border-navy-900/10 px-6 py-5 sm:px-7 sm:py-6">
                  <InlineAlert tone="success">
                    Reservation created — payment required to confirm your charter.
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

              {quote.status === QUOTE_STATUSES.APPROVED && isPastValidity ? (
                <div className="space-y-2 border-t border-navy-900/10 px-6 py-5 sm:px-7 sm:py-6">
                  <InlineAlert tone="neutral">
                    This proposal&apos;s validity window has passed. Submit a new request for updated pricing.
                  </InlineAlert>
                  <Button href="/request-charter" variant="outline" className="w-full justify-center">
                    New Charter Request
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {quote.status === QUOTE_STATUSES.REJECTED ? (
            <div className="space-y-3 rounded-xl border border-navy-900/10 bg-white p-6 sm:p-7">
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
            <div className="space-y-3 rounded-xl border border-navy-900/10 bg-white p-6 sm:p-7">
              <InlineAlert tone="neutral">
                This charter proposal is no longer available for acceptance. Submit a new request for updated
                pricing.
              </InlineAlert>
              <Button href="/request-charter" variant="outline" className="w-full justify-center">
                New Charter Request
              </Button>
            </div>
          ) : null}

          {isPending ? (
            <div className="rounded-xl border border-navy-900/10 bg-white p-6 sm:p-7">
              <InlineAlert tone="info">We&apos;re reviewing this request. You&apos;ll hear from us shortly.</InlineAlert>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}