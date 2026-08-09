import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Receipt,
  CheckCircle,
  CurrencyCircleDollar,
} from "@phosphor-icons/react/dist/ssr";
import { CustomerBookingStatusBadge } from "@/components/booking/BookingCard/CustomerBookingStatusBadge";
import { CustomerBookingPaymentStatusBadge } from "@/components/booking/BookingCard/CustomerBookingPaymentStatusBadge";
import { BookingTimeline } from "@/components/booking/BookingTimeline/BookingTimeline";
import { BookingActionsPanel } from "@/components/booking/BookingSummary/BookingActionsPanel";
import { MpesaButton } from "@/components/payment/MpesaButton/MpesaButton";
import { CustomerPaymentStatusBadge } from "@/components/payment/PaymentCard/CustomerPaymentStatusBadge";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { Button } from "@/components/shared/buttons/Button";
import { getMyBookingById } from "@/features/booking/lib/getBookings";
import { getMyPaymentsForBooking } from "@/features/payment/lib/getPayments";
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

  let booking;
  try {
    booking = await getMyBookingById(id);
  } catch (error) {
    if (isAppError(error) && (error instanceof NotFoundError || error instanceof ForbiddenError)) {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4">
          <Button href="/dashboard/bookings" variant="ghost" size="sm" className="-ml-3 text-slate-500 hover:text-navy-900">
            ← All bookings
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="spec-readout text-xs font-medium uppercase tracking-widest text-slate-400">
              {booking.bookingNumber}
            </p>
            <h1 className="mt-1.5 font-editorial text-3xl font-light tracking-tight text-navy-900">
              {booking.departureAirportCode}{" "}
              <span className="text-slate-400">→</span>{" "}
              {booking.destinationAirportCode}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
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
        <div className="flex items-start gap-4 rounded-xl border border-green-300 bg-green-50 px-6 py-5">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-green-800">Your charter is confirmed.</p>
            <p className="mt-0.5 text-sm text-green-700">
              Everything is in order. Our team will be in touch with departure details closer to your flight date.
            </p>
          </div>
        </div>
      ) : null}

      {/* Payment due banner */}
      {needsPayment && !activePayment ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-200 bg-sky-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <CurrencyCircleDollar className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sky-800">
                {formatCurrency(booking.balanceAmount, booking.currency)} outstanding
              </p>
              <p className="mt-0.5 text-sm text-sky-700">
                Your booking is awaiting payment. Pay with M-Pesa to confirm your charter.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* Left: flight details + timeline + actions */}
        <div className="space-y-5">
          {/* Flight itinerary card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Flight details
            </h2>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Route</dt>
                <dd className="mt-1.5 font-display text-xl font-medium text-navy-900">
                  {booking.departureAirportCode} → {booking.destinationAirportCode}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {booking.returnDate ? "Dates" : "Date"}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {formatDate(booking.departureDate)}
                  {booking.returnDate ? (
                    <> — {formatDate(booking.returnDate)}</>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Passengers</dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900">
                  {booking.passengerCount} {booking.passengerCount === 1 ? "passenger" : "passengers"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Flight type</dt>
                <dd className="mt-1.5 text-sm font-medium text-navy-900 capitalize">
                  {MISSION_TYPE_LABELS[booking.missionType]}
                </dd>
              </div>
              {aircraftName ? (
                <div className="sm:col-span-2 border-t border-slate-100 pt-5">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Aircraft</dt>
                  <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-lg font-medium text-navy-900">{aircraftName}</span>
                    {aircraft?.manufacturer || aircraft?.model ? (
                      <span className="text-sm text-slate-500">
                        {aircraft?.manufacturer} {aircraft?.model}
                      </span>
                    ) : null}
                    {aircraft?.registration ? (
                      <span className="spec-readout text-xs text-slate-400">
                        Reg: {aircraft.registration}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>

            {booking.specialRequests ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Special requests</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{booking.specialRequests}</p>
              </div>
            ) : null}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Booking timeline
            </h2>
            <div className="mt-5">
              <BookingTimeline timeline={booking.timeline} />
            </div>
          </div>

          {/* Manage booking */}
          {canCancel ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Manage booking
              </h2>
              <p className="mt-2 text-sm text-slate-500">
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
        <aside className="h-fit space-y-5 lg:sticky lg:top-28">
          {/* Payment summary */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Payment
              </h3>

              {/* Balance due — make this the hero when unpaid */}
              {paymentStatus !== "paid" && !isTerminal ? (
                <div className="mt-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Balance due</p>
                  <p className="spec-readout mt-1 text-4xl font-bold text-navy-900">
                    {formatCurrency(booking.balanceAmount, booking.currency)}
                  </p>
                </div>
              ) : null}

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{paymentProgress}% paid</span>
                  <span>{formatCurrency(booking.totalAmount, booking.currency)} total</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-editorial ${
                      paymentProgress >= 100 ? "bg-green-500" : "bg-sky-500"
                    }`}
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <dl className="divide-y divide-slate-100 px-6">
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-slate-500">Total charter fee</dt>
                <dd className="spec-readout text-sm font-semibold text-navy-900">
                  {formatCurrency(booking.totalAmount, booking.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-slate-500">Paid to date</dt>
                <dd className="spec-readout text-sm font-medium text-navy-900">
                  {formatCurrency(booking.paidAmount, booking.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm font-medium text-navy-900">Remaining balance</dt>
                <dd className={`spec-readout text-sm font-bold ${booking.balanceAmount > 0 ? "text-sky-600" : "text-green-600"}`}>
                  {formatCurrency(booking.balanceAmount, booking.currency)}
                </dd>
              </div>
            </dl>

            {/* M-Pesa payment or fully-paid state */}
            <div className="px-6 py-5 border-t border-slate-100">
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
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Payment history
              </h3>
              <ul className="mt-4 space-y-3">
                {payments.map((payment) => (
                  <li
                    key={payment._id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(payment.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <CustomerPaymentStatusBadge status={payment.status} />
                      {payment.status === PAYMENT_STATUSES.COMPLETED ? (
                        <Link
                          href={`/dashboard/payments/${payment._id}`}
                          className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                        >
                          <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
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
