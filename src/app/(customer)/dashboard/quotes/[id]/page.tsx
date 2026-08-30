import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Warning, Paperclip, CheckCircle, Info, Airplane } from "@phosphor-icons/react/dist/ssr";
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
            Charter proposal
          </p>
          <RouteDisplay
            className="mt-3"
            size="lg"
            departure={{ code: quote.departureAirportCode, name: departureInfo }}
            destination={{ code: quote.destinationAirportCode, name: destinationInfo }}
            isRoundTrip={quote.isRoundTrip}
          />
          <p className="mt-2 text-sm text-slate-500">
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

      {/* Status strips — a thin colored accent, not a boxed alert */}
      {isApproved && !isPastValidity ? (
        <div className="flex items-start gap-3 rounded-lg border-l-4 border-green-500 bg-green-50/60 px-5 py-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-green-800">Your charter proposal is ready to review.</p>
            <p className="mt-0.5 text-sm text-green-700">
              Accept to create your reservation and continue to payment. No payment is taken by accepting.
            </p>
          </div>
        </div>
      ) : null}

      {isPending ? (
        <div className="flex items-start gap-3 rounded-lg border-l-4 border-sky-400 bg-sky-50/60 px-5 py-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
          <div>
            <p className="font-medium text-sky-800">We&apos;re preparing your proposal.</p>
            <p className="mt-0.5 text-sm text-sky-700">
              Our operations team is reviewing your request. We&apos;ll be in touch shortly with aircraft options
              and pricing.
            </p>
          </div>
        </div>
      ) : null}

      {/* order-1/order-2 keep the proposal + decision panel above the
          supporting detail on small screens (aircraft, price, and the
          primary action belong above the fold), while the desktop grid
          restores the usual two-column reading order. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,1.35fr] lg:gap-10">
        {/* Right: the one deliberate panel — proposal + decision, styled like a
            boarding-pass stub with an accent top edge, since this is the sole
            spot that should carry visual weight on the page. Given more of the
            grid's width than the left column (reversed from the original
            1.6fr/1fr split) so the card reads as a wide, short rectangle
            instead of a tall narrow one. */}
        <aside className="order-1 h-fit space-y-5 lg:order-2">
          {(hasPricingInfo && (selectedAircraft || quote.quotedAmount != null)) || canDecide ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:px-7 sm:py-5">
              {hasPricingInfo && (selectedAircraft || quote.quotedAmount != null) ? (
                <>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Charter proposal
                  </h3>

                  {/* Aircraft + price sit side by side as one horizontal
                      strip, forced to stay on one row (flex-nowrap) at every
                      breakpoint: the aircraft column truncates its own text
                      via min-w-0 rather than ever pushing price to a second
                      line, and the price column is shrink-0 with nowrap
                      numerals so it can't get squeezed either. Type scales
                      up slightly on larger screens since there's more room
                      to let it breathe there. */}
                  <div className="mt-3 flex flex-nowrap items-stretch gap-3 sm:mt-4 sm:gap-5">
                    {selectedAircraft ? (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900/5 sm:h-6 sm:w-6">
                            <Airplane className="h-3 w-3 text-navy-700" weight="fill" aria-hidden="true" />
                          </span>
                          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Your aircraft
                          </p>
                        </div>
                        <p className="mt-1 truncate font-editorial text-base font-light text-navy-900 sm:text-lg">
                          {selectedAircraft.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {selectedAircraft.manufacturer} {selectedAircraft.model}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          Up to {selectedAircraft.passengerCapacity} passengers
                        </p>
                      </div>
                    ) : null}

                    {selectedAircraft && quote.quotedAmount != null ? (
                      <div className="w-px shrink-0 self-stretch bg-slate-200" aria-hidden="true" />
                    ) : null}

                    {quote.quotedAmount != null ? (
                      <div className={selectedAircraft ? "shrink-0 text-right" : "flex-1"}>
                        <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Charter total
                        </p>
                        <p className="spec-readout mt-1 whitespace-nowrap text-lg font-bold leading-tight text-navy-900 sm:text-xl">
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
                </>
              ) : null}

              {canDecide ? (
                <div
                  className={
                    hasPricingInfo && (selectedAircraft || quote.quotedAmount != null)
                      ? "mt-3 border-t border-dashed border-slate-300 pt-3 sm:mt-4 sm:pt-4"
                      : ""
                  }
                >
                  <h3 className="font-editorial text-base font-light text-navy-900 sm:text-lg">Ready to proceed?</h3>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Review your charter details and accept the proposal to continue to your reservation.
                  </p>
                  <div className="mt-2.5 sm:mt-3.5">
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
                <div className="mt-3 space-y-2 border-t border-dashed border-slate-300 pt-3 sm:mt-4 sm:pt-4">
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
                <div className="mt-3 space-y-2 border-t border-dashed border-slate-300 pt-3 sm:mt-4 sm:pt-4">
                  <InlineAlert tone="neutral">
                    This proposal&apos;s validity window has passed. Submit a new request for updated pricing.
                  </InlineAlert>
                  <Button href="/request-charter" variant="outline" className="w-full justify-center">
                    New Charter Request
                  </Button>
                </div>
              ) : null}

              <p className="spec-readout mt-3 text-[10px] uppercase tracking-widest text-slate-400 sm:mt-4">
                Quote {quote.quoteNumber}
              </p>
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
            <InlineAlert tone="info">We&apos;re reviewing this request. You&apos;ll hear from us shortly.</InlineAlert>
          ) : null}
        </aside>

        {/* Left: one flowing document, sections divided by hairlines instead of boxed cards */}
        <div className="order-2 divide-y divide-slate-100 lg:order-1">
          <section className="pb-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Trip details</h2>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Route</dt>
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
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {quote.isRoundTrip ? "Dates" : "Date"}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {formatDate(quote.departureDate)}
                  {quote.isRoundTrip && quote.returnDate ? <> — {formatDate(quote.returnDate)}</> : null}
                </dd>
              </div>
              {quote.departureTime ? (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Departure time
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium text-navy-900">{quote.departureTime}</dd>
                </div>
              ) : null}
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
      </div>
    </div>
  );
}