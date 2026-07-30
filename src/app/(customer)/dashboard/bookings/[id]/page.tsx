import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Users, MapPin } from "@phosphor-icons/react/dist/ssr";
import { DetailHeader } from "@/components/admin/layout/DetailHeader";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingTimeline } from "@/components/booking/BookingTimeline/BookingTimeline";
import { BookingActionsPanel } from "@/components/booking/BookingSummary/BookingActionsPanel";
import { MpesaButton } from "@/components/payment/MpesaButton/MpesaButton";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { getMyBookingById } from "@/features/booking/lib/getBookings";
import { formatCurrency, calculatePaymentProgress } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { BOOKING_TERMINAL_STATUSES } from "@/database/constants/booking-status";
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
  const canCancel = !BOOKING_TERMINAL_STATUSES.includes(booking.status);
  const paymentProgress = calculatePaymentProgress(booking.totalAmount, booking.paidAmount);

  return (
    <div>
      <DetailHeader
        variant="light"
        backHref="/dashboard/bookings"
        backLabel="Bookings"
        eyebrow={booking.bookingNumber}
        title={`${booking.departureAirportCode} → ${booking.destinationAirportCode}`}
        status={<BookingStatusBadge status={booking.status} />}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {formatDate(booking.departureDate)}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {booking.passengerCount} passengers
              </div>
              {aircraftName ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  {aircraftName}
                </div>
              ) : null}
            </div>

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
                modificationAlreadyRequested={booking.modificationRequested}
              />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-7 shadow-soft lg:sticky lg:top-28">
          <h3 className="font-display text-base font-semibold text-navy-900">Payment</h3>

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
              <MpesaButton bookingId={booking._id} amount={booking.balanceAmount} currency={booking.currency} />
            </div>
          ) : booking.balanceAmount <= 0 ? (
            <div className="mt-4">
              <InlineAlert tone="success">This booking is fully paid.</InlineAlert>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}