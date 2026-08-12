import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Receipt,
  CheckCircle,
  CurrencyCircleDollar,
  Airplane,
  ClockCounterClockwise,
  SlidersHorizontal,
  CreditCard,
  Wallet,
  CaretLeft,
} from "@phosphor-icons/react/dist/ssr";
import { CustomerBookingStatusBadge } from "@/components/booking/BookingCard/CustomerBookingStatusBadge";
import { CustomerBookingPaymentStatusBadge } from "@/components/booking/BookingCard/CustomerBookingPaymentStatusBadge";
import { BookingTimeline } from "@/components/booking/BookingTimeline/BookingTimeline";
import { BookingActionsPanel } from "@/components/booking/BookingSummary/BookingActionsPanel";
import { MpesaButton } from "@/components/payment/MpesaButton/MpesaButton";
import { CustomerPaymentStatusBadge } from "@/components/payment/PaymentCard/CustomerPaymentStatusBadge";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { Button } from "@/components/shared/buttons/Button";
import { WrongAccountNotice } from "@/components/shared/WrongAccountNotice";
import { getMyBookingById } from "@/features/booking/lib/getBookings";
import { getMyPaymentsForBooking } from "@/features/payment/lib/getPayments";
import { requireAuth } from "@/middleware/auth";
import { checkUserRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
import { formatCurrency, calculatePaymentProgress, getBookingPaymentStatus } from "@/utils/currency";
import { formatDate, formatDateTime } from "@/utils/date";
import { BOOKING_TERMINAL_STATUSES, BOOKING_STATUSES } from "@/database/constants/booking-status";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { NotFoundError, ForbiddenError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Booking Details" };

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;

  const { clerkId } = await requireAuth();
  const rateLimit = checkUserRateLimit(clerkId, "booking-detail", RATE_LIMITS.DETAIL_PAGE_LOOKUP);
  if (!rateLimit.allowed) {
    notFound();
  }

  let booking;
  try {
    booking = await getMyBookingById(id);
  } catch (error) {
    // See the matching comment in the quotes detail page: a Forbidden
    // here means "signed in with the wrong account," not "this booking
    // doesn't exist" — those deserve different screens.
    if (isAppError(error) && error instanceof ForbiddenError) {
      return <WrongAccountNotice resourceLabel="booking" />;
    }
    if (isAppError(error) && error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const aircraft = typeof booking.aircraft === "object" ? booking.aircraft : undefined;
  const aircraftName = aircraft?.name;
  const canCancel = !BOOKING_TERMINAL_STATUSES.includes(booking.status);
  const paymentProgress = calculatePaymentProgress(booking.totalAmount, booking.paidAmount);
  const paymentStatus = getBookingPaymentStatus(booking.totalAmount, booking.paidAmount);
  const payments = await getMyPaymentsForBooking(booking._id);
  const activePayment = payments.find(
    (p) => p.status === PAYMENT_STATUSES.PENDING || p.status === PAYMENT_STATUSES.PROCESSING
  );
  const isTerminal = BOOKING_TERMINAL_STATUSES.includes(booking.status);
  const isConfirmed = booking.status === BOOKING_STATUSES.CONFIRMED;
  const needsPayment = !isTerminal && booking.balanceAmount > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="mb-3">
          <Button href="/dashboard/bookings" variant="ghost" size="sm" className="-ml-3 gap-1 text-xs text-slate-500 hover:text-navy-900">
            <CaretLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All bookings
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="spec-readout text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              {booking.bookingNumber}
            </p>
            <h1 className="mt-1.5 font-editorial text-2xl font-light tracking-tight text-navy-900 sm:text-[1.75rem]">
              {booking.departureAirportCode}{" "}
              <span className="text-champagne-500">→</span>{" "}
              {booking.destinationAirportCode}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Booked {formatDate(booking.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CustomerBookingStatusBadge status={booking.status} />
            <CustomerBookingPaymentStatusBadge status={paymentStatus} />
          </div>
        </div>
      </div>

      {/* Confirmation banner */}
      {isConfirmed && paymentStatus === "paid" ? (
        <div className="flex items-start gap-3 rounded-xl border border-champagne-200 bg-champagne-50 px-5 py-4">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-navy-900">Your charter is confirmed.</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Everything is in order. Our team will be in touch with departure details closer to your flight date.
            </p>
          </div>
        </div>
      ) : null}

      {/* Payment due banner */}
      {needsPayment && !activePayment ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <CurrencyCircleDollar className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {formatCurrency(booking.balanceAmount, booking.currency)} outstanding
              </p>
              <p className="mt-0.5 text-xs text-blue-700">
                Your booking is awaiting payment. Pay with M-Pesa to confirm your charter.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr,1fr]">
        {/* Left: flight details + timeline + actions. Ordered after the
            payment panel on mobile (order-2) since payment is the most
            actionable thing on the page — desktop reverts to the
            designed two-column layout via lg:order-1. */}
        <div className="order-2 space-y-4 lg:order-1">
          {/* Flight itinerary card */}
          <div className="rounded-xl border border-navy-900/10 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Airplane className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
              Flight details
            </h2>

            <dl className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5">
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Route</dt>
                <dd className="font-editorial mt-1.5 text-lg font-medium text-navy-900">
                  {booking.departureAirportCode} → {booking.destinationAirportCode}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  {booking.returnDate ? "Dates" : "Date"}
                </dt>
                <dd className="mt-1.5 text-xs font-medium text-navy-900">
                  {formatDate(booking.departureDate)}
                  {booking.returnDate ? (
                    <> — {formatDate(booking.returnDate)}</>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Passengers</dt>
                <dd className="mt-1.5 text-xs font-medium text-navy-900">
                  {booking.passengerCount} {booking.passengerCount === 1 ? "passenger" : "passengers"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Flight type</dt>
                <dd className="mt-1.5 text-xs font-medium text-navy-900 capitalize">
                  {MISSION_TYPE_LABELS[booking.missionType]}
                </dd>
              </div>
              {aircraftName ? (
                <div className="sm:col-span-2 border-t border-navy-900/10 pt-4 sm:pt-5">
                  <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Aircraft</dt>
                  <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-editorial text-base font-medium text-navy-900">{aircraftName}</span>
                    {aircraft?.manufacturer || aircraft?.model ? (
                      <span className="text-xs text-slate-500">
                        {aircraft?.manufacturer} {aircraft?.model}
                      </span>
                    ) : null}
                    {aircraft?.registration ? (
                      <span className="spec-readout text-[11px] text-slate-400">
                        Reg: {aircraft.registration}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>

            {booking.specialRequests ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-3.5 sm:mt-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Special requests</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{booking.specialRequests}</p>
              </div>
            ) : null}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-navy-900/10 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <ClockCounterClockwise className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
              Booking timeline
            </h2>
            <div className="mt-4 sm:mt-5">
              <BookingTimeline timeline={booking.timeline} />
            </div>
          </div>

          {/* Manage booking */}
          {canCancel ? (
            <div className="rounded-xl border border-navy-900/10 bg-white p-5 sm:p-6">
              <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <SlidersHorizontal className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
                Manage booking
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                Need to change or cancel your charter? Let our team know and we&apos;ll follow up promptly.
              </p>
              <div className="mt-4">
                <BookingActionsPanel
                  bookingId={booking._id}
                  canCancel={canCancel}
                  cancellationAlreadyRequested={booking.cancellationRequested}
                  modificationAlreadyRequested={booking.modificationRequested}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: payment panel */}
        <aside className="order-1 h-fit space-y-4 lg:order-2 lg:sticky lg:top-24">
          {/* Payment summary */}
          <div className="rounded-xl border border-navy-900/10 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-900/10 sm:px-6 sm:py-5">
              <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <CreditCard className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
                Payment
              </h3>

              {/* Balance due — a soft blue/champagne panel makes this the
                  hero figure when unpaid, echoing the amount treatment
                  used on the printed receipt. */}
              {paymentStatus !== "paid" && !isTerminal ? (
                <div className="mt-3.5 rounded-lg border border-champagne-200/70 bg-gradient-to-br from-blue-50 via-white to-champagne-50 px-4 py-3">
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-champagne-700">Balance due</p>
                  <p className="font-editorial spec-readout mt-1 text-2xl font-semibold text-blue-800">
                    {formatCurrency(booking.balanceAmount, booking.currency)}
                  </p>
                </div>
              ) : null}

              {/* Progress bar */}
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span>{paymentProgress}% paid</span>
                  <span>{formatCurrency(booking.totalAmount, booking.currency)} total</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-editorial ${
                      paymentProgress >= 100 ? "bg-champagne-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <dl className="divide-y divide-navy-900/10 px-5 sm:px-6">
              <div className="flex items-center justify-between py-3">
                <dt className="text-xs text-slate-500">Total charter fee</dt>
                <dd className="font-editorial spec-readout text-xs font-semibold text-navy-900">
                  {formatCurrency(booking.totalAmount, booking.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-xs text-slate-500">Paid to date</dt>
                <dd className="font-editorial spec-readout text-xs font-medium text-navy-900">
                  {formatCurrency(booking.paidAmount, booking.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-xs font-medium text-navy-900">Remaining balance</dt>
                <dd
                  className={`font-editorial spec-readout text-xs font-bold ${
                    booking.balanceAmount > 0 ? "text-blue-700" : "text-champagne-700"
                  }`}
                >
                  {formatCurrency(booking.balanceAmount, booking.currency)}
                </dd>
              </div>
            </dl>

            {/* M-Pesa payment or fully-paid state */}
            <div className="px-5 py-4 border-t border-navy-900/10 sm:px-6 sm:py-5">
              {booking.balanceAmount > 0 && canCancel ? (
                <MpesaButton
                  bookingId={booking._id}
                  amount={booking.balanceAmount}
                  currency={booking.currency}
                  resumeCheckoutRequestId={activePayment?.mpesa.checkoutRequestId}
                />
              ) : booking.balanceAmount <= 0 ? (
                <InlineAlert tone="success">
                  This booking is fully paid. Your charter is confirmed.
                </InlineAlert>
              ) : null}
            </div>
          </div>

          {/* Payment history */}
          {payments.length > 0 ? (
            <div className="rounded-xl border border-navy-900/10 bg-white p-5 sm:p-6">
              <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Wallet className="h-3.5 w-3.5 text-champagne-500" aria-hidden="true" />
                Payment history
              </h3>
              <ul className="mt-3.5 space-y-3">
                {payments.map((payment) => (
                  <li
                    key={payment._id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-editorial text-xs font-semibold text-navy-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{formatDateTime(payment.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <CustomerPaymentStatusBadge status={payment.status} />
                      {payment.status === PAYMENT_STATUSES.COMPLETED ? (
                        <Link
                          href={`/dashboard/payments/${payment._id}`}
                          className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                        >
                          <Receipt className="h-3 w-3" aria-hidden="true" />
                          Receipt
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}