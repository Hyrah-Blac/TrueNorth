import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Users, Airplane, Briefcase, Receipt } from "@phosphor-icons/react/dist/ssr";
import { DetailHeader } from "@/components/admin/layout/DetailHeader";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingPaymentStatusBadge } from "@/components/booking/BookingCard/BookingPaymentStatusBadge";
import { BookingTimeline } from "@/components/booking/BookingTimeline/BookingTimeline";
import { BookingActionsPanel } from "@/components/booking/BookingSummary/BookingActionsPanel";
import { MpesaButton } from "@/components/payment/MpesaButton/MpesaButton";
import { PaymentStatusBadge } from "@/components/payment/PaymentCard/PaymentStatusBadge";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { getMyBookingById } from "@/features/booking/lib/getBookings";
import { getMyPaymentsForBooking } from "@/features/payment/lib/getPayments";
import { formatCurrency, calculatePaymentProgress, getBookingPaymentStatus } from "@/utils/currency";
import { formatDate, formatDateTime } from "@/utils/date";
import { BOOKING_TERMINAL_STATUSES } from "@/database/constants/booking-status";
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

  const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
  const aircraft = typeof booking.aircraft === "object" ? booking.aircraft : undefined;
  const canCancel = !BOOKING_TERMINAL_STATUSES.includes(booking.status);
  const paymentProgress = calculatePaymentProgress(booking.totalAmount, booking.paidAmount);
  const payments = await getMyPaymentsForBooking(booking._id);
  const activePayment = payments.find(
    (p) => p.status === PAYMENT_STATUSES.PENDING || p.status === PAYMENT_STATUSES.PROCESSING
  );

  return (
    <div>
      <DetailHeader
        variant="light"
        backHref="/dashboard/bookings"
        backLabel="Bookings"
        eyebrow={booking.bookingNumber}
        title={`${booking.departureAirportCode} → ${booking.destinationAirportCode}`}
        subtitle={`Booked on ${formatDate(booking.createdAt)}`}
        status={<BookingStatusBadge status={booking.status} />}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {formatDate(booking.departureDate)}
                {booking.returnDate ? ` – ${formatDate(booking.returnDate)}` : ""}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {booking.passengerCount} passengers
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Briefcase className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {MISSION_TYPE_LABELS[booking.missionType]}
              </div>
            </div>

            {aircraftName ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <Airplane className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                <span className="font-medium text-navy-900">{aircraftName}</span>
                {aircraft?.manufacturer || aircraft?.model ? (
                  <span>
                    {aircraft?.manufacturer} {aircraft?.model}
                  </span>
                ) : null}
                {aircraft?.registration ? (
                  <span className="spec-readout text-xs text-slate-400">{aircraft.registration}</span>
                ) : null}
              </div>
            ) : null}

            {booking.specialRequests ? (
              <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-medium text-navy-900">Special requests: </span>
                {booking.specialRequests}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <h3 className="font-display text-base font-semibold text-navy-900">Timeline</h3>
            <div className="mt-6">
              <BookingTimeline timeline={booking.timeline} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <h3 className="font-display text-base font-semibold text-navy-900">Manage this booking</h3>
            <div className="mt-4">
              <BookingActionsPanel
                bookingId={booking._id}
                canCancel={canCancel}
                cancellationAlreadyRequested={booking.cancellationRequested}
                modificationAlreadyRequested={booking.modificationRequested}
              />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-7 shadow-soft lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-navy-900">Payment</h3>
            <BookingPaymentStatusBadge status={getBookingPaymentStatus(booking.totalAmount, booking.paidAmount)} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-editorial ${
                  paymentProgress >= 100 ? "bg-green-500" : "bg-sky-500"
                }`}
                style={{ width: `${paymentProgress}%` }}
              />
            </div>
            <span className="spec-readout text-xs text-slate-500">{paymentProgress}%</span>
          </div>

          <dl className="mt-4 space-y-2.5 border-b border-slate-100 pb-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total</dt>
              <dd className="spec-readout font-medium text-navy-900">
                {formatCurrency(booking.totalAmount, booking.currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Paid</dt>
              <dd className="spec-readout font-medium text-navy-900">
                {formatCurrency(booking.paidAmount, booking.currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Balance</dt>
              <dd className="spec-readout font-semibold text-navy-900">
                {formatCurrency(booking.balanceAmount, booking.currency)}
              </dd>
            </div>
          </dl>

          {booking.balanceAmount > 0 && canCancel ? (
            <div className="mt-4">
              <MpesaButton
                bookingId={booking._id}
                amount={booking.balanceAmount}
                currency={booking.currency}
                resumeCheckoutRequestId={activePayment?.mpesa.checkoutRequestId}
              />
            </div>
          ) : booking.balanceAmount <= 0 ? (
            <div className="mt-4">
              <InlineAlert tone="success">This booking is fully paid.</InlineAlert>
            </div>
          ) : null}

          {payments.length > 0 ? (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">Payment history</h4>
              <ul className="mt-3 space-y-3">
                {payments.map((payment) => (
                  <li key={payment._id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(payment.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <PaymentStatusBadge status={payment.status} />
                      {payment.status === PAYMENT_STATUSES.COMPLETED ? (
                        <Link
                          href={`/dashboard/payments/${payment._id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
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