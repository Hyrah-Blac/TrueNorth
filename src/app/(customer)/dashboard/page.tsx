import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, AirplaneTakeoff, FileText, CurrencyCircleDollar, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { BookingCard } from "@/components/booking/BookingCard/BookingCard";
import { QuoteRow } from "@/components/quote/QuoteRow";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { Button } from "@/components/shared/buttons/Button";
import { getMyBookings } from "@/features/booking/lib/getBookings";
import { getMyQuotes } from "@/features/quote/lib/getQuotes";
import { getBookingIdsWithTickets } from "@/features/ticket/lib/getTicketForBooking";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { formatCurrency } from "@/utils/currency";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";

export default async function DashboardOverviewPage() {
  const [bookings, quotes] = await Promise.all([getMyBookings(), getMyQuotes()]);
  // Batched (one query for every card) rather than one ticketExistsForBooking
  // call per BookingCard rendered below.
  const ticketedBookingIds = await getBookingIdsWithTickets(bookings.map((b) => b._id));
  // Same batching for QuoteRow's route display — one lookup for every
  // quote shown here, so city names ("Nairobi → Aketi") render instead of
  // bare codes, matching the full Quotes list.
  const airportNames = await getAirportNamesByCodes(
    quotes.flatMap((quote) => [quote.departureAirportCode, quote.destinationAirportCode])
  );

  const activeBookings = bookings.filter(
    (b) => b.status !== BOOKING_STATUSES.COMPLETED && b.status !== BOOKING_STATUSES.CANCELLED
  );
  const quotesNeedingAction = quotes.filter((q) => q.status === QUOTE_STATUSES.APPROVED);
  const bookingsNeedingPayment = bookings.filter(
    (b) => b.balanceAmount > 0 && b.status !== BOOKING_STATUSES.CANCELLED && b.status !== BOOKING_STATUSES.COMPLETED
  );
  const outstandingBalance = bookingsNeedingPayment.reduce((sum, b) => sum + b.balanceAmount, 0);
  const confirmedBookings = bookings.filter((b) => b.status === BOOKING_STATUSES.CONFIRMED);

  // Sort so action-needed items appear first
  const sortedQuotes = [...quotes].sort((a, b) => {
    if (a.status === QUOTE_STATUSES.APPROVED && b.status !== QUOTE_STATUSES.APPROVED) return -1;
    if (b.status === QUOTE_STATUSES.APPROVED && a.status !== QUOTE_STATUSES.APPROVED) return 1;
    return 0;
  });

  const hasAnyActivity = bookings.length > 0 || quotes.length > 0;
  const hasUrgentItems = quotesNeedingAction.length > 0 || bookingsNeedingPayment.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 py-8 sm:py-12 lg:py-16" style={{ "--font-editorial": "var(--font-dashboard-serif)" } as CSSProperties}>
      <PageHeader
        variant="light"
        divider={false}
        title="Your Charter Portal"
        description="Manage your bookings, review quotes, and track payments."
      />

      {/* Attention-required banner */}
      {hasUrgentItems ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 mb-3">
            Action required
          </p>
          <div className="space-y-2">
            {quotesNeedingAction.map((q) => (
              <Link
                key={q._id}
                href={`/dashboard/quotes/${q._id}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="font-medium text-navy-900">
                    Quote {q.quoteNumber} is ready
                  </span>
                  <RouteDisplay
                    size="sm"
                    departure={{ code: q.departureAirportCode, name: airportNames[q.departureAirportCode.toUpperCase()] }}
                    destination={{ code: q.destinationAirportCode, name: airportNames[q.destinationAirportCode.toUpperCase()] }}
                  />
                  {q.quotedAmount ? (
                    <span className="text-slate-500">· {formatCurrency(q.quotedAmount, q.quotedCurrency ?? "KES")}</span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-sky-600">
                  <span className="text-xs font-medium">Review &amp; Accept</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
            {bookingsNeedingPayment.map((b) => (
              <Link
                key={b._id}
                href={`/dashboard/bookings/${b._id}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                  </span>
                  <span className="font-medium text-navy-900">
                    Booking {b.bookingNumber}
                  </span>
                  <span className="text-slate-500">
                    {formatCurrency(b.balanceAmount, b.currency)} outstanding
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-sky-600">
                  <span className="text-xs font-medium">Pay Now</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active trips"
          value={String(activeBookings.length)}
          hint={activeBookings.length === 0 ? "No active flights" : "In progress or upcoming"}
          icon={AirplaneTakeoff}
        />

        <StatCard
          label="Open quotes"
          value={String(
            quotes.filter(
              (q) =>
                q.status === QUOTE_STATUSES.PENDING ||
                q.status === QUOTE_STATUSES.REVIEWING ||
                q.status === QUOTE_STATUSES.APPROVED
            ).length
          )}
          hint={quotesNeedingAction.length > 0 ? `${quotesNeedingAction.length} ready to accept` : "No action needed"}
          icon={FileText}
        />

        <StatCard
          label="Balance due"
          value={formatCurrency(outstandingBalance)}
          hint={
            bookingsNeedingPayment.length === 0
              ? "All payments up to date"
              : `Across ${bookingsNeedingPayment.length} booking${bookingsNeedingPayment.length === 1 ? "" : "s"}`
          }
          icon={CurrencyCircleDollar}
        />

        <StatCard
          label="Confirmed"
          value={String(confirmedBookings.length)}
          hint={confirmedBookings.length === 0 ? "None confirmed yet" : "Charter confirmed"}
          icon={CheckCircle}
        />
      </div>

      {!hasAnyActivity ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-950/5 text-navy-900">
            <AirplaneTakeoff className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-display text-xl font-medium text-navy-900">Ready for your first charter?</h3>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
            Tell us your route, dates, and requirements. Our operations team will respond with aircraft options and pricing — usually within a few hours.
          </p>
          <div className="mt-7">
            <Button href="/request-charter" variant="primary">
              Request a Charter
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Bookings section */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-editorial text-lg font-light text-navy-900">Your bookings</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {bookings.length === 0 ? "No bookings yet" : `${bookings.length} total`}
                </p>
              </div>
              <Link
                href="/dashboard/bookings"
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
              >
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                icon={<AirplaneTakeoff className="h-5 w-5" aria-hidden="true" />}
                title="No bookings yet"
                description="Once you accept a charter quote, your booking will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...bookings]
                  .sort((a, b) => {
                    // Unpaid first, then by date
                    if (a.balanceAmount > 0 && b.balanceAmount <= 0) return -1;
                    if (b.balanceAmount > 0 && a.balanceAmount <= 0) return 1;
                    return 0;
                  })
                  .slice(0, 3)
                  .map((booking) => (
                    <BookingCard key={booking._id} booking={booking} hasTicket={ticketedBookingIds.has(booking._id)} />
                  ))}
              </div>
            )}
          </div>

          {/* Quotes section — a short list using the same QuoteRow the main
              Quotes page uses, rather than a separate card component, so
              a quote looks the same wherever it appears in the portal. */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="font-editorial text-lg font-light text-navy-900">Charter quotes</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {quotes.length === 0 ? "No quotes yet" : `${quotes.length} total`}
                </p>
              </div>
              <Link
                href="/dashboard/quotes"
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
              >
                View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {quotes.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                title="No quotes yet"
                description="Submit a charter request to receive a customised quote from our team."
              />
            ) : (
              <div className="space-y-3">
                {sortedQuotes.slice(0, 3).map((quote) => (
                  <QuoteRow key={quote._id} quote={quote} airportNames={airportNames} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}