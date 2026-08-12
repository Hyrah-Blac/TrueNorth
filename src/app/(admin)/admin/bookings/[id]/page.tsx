import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Users, Mail, Phone, Building2, Plane } from "lucide-react";
import { DetailHeader } from "@/components/admin/layout/DetailHeader";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingPaymentStatusBadge } from "@/components/booking/BookingCard/BookingPaymentStatusBadge";
import { BookingTimeline } from "@/components/booking/BookingTimeline/BookingTimeline";
import { BookingStatusActions } from "@/components/admin/dialogs/BookingStatusActions";
import { getBookingForAdmin } from "@/features/admin/lib/getBookingsForAdmin";
import { formatCurrency, getBookingPaymentStatus } from "@/utils/currency";
import { formatDate, formatDateTime } from "@/utils/date";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { NotFoundError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Booking Details" };

interface AdminBookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const { id } = await params;

  let booking;
  try {
    booking = await getBookingForAdmin(id);
  } catch (error) {
    if (isAppError(error) && error instanceof NotFoundError) notFound();
    throw error;
  }

  const customer = typeof booking.customer === "object" && booking.customer !== null ? booking.customer : null;
  const aircraft = typeof booking.aircraft === "object" ? booking.aircraft : undefined;
  const paymentStatus = getBookingPaymentStatus(booking.totalAmount, booking.paidAmount);

  return (
    <div>
      <DetailHeader
        backHref="/admin/bookings"
        backLabel="Bookings"
        eyebrow={booking.bookingNumber}
        title={`${booking.departureAirportCode} → ${booking.destinationAirportCode}`}
        subtitle={`Created ${formatDateTime(booking.createdAt)} · Last updated ${formatDateTime(booking.updatedAt)}`}
        status={<BookingStatusBadge status={booking.status} />}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarDays className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {formatDate(booking.departureDate)}
                {booking.returnDate ? ` – ${formatDate(booking.returnDate)}` : ""}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {booking.passengerCount} passengers
              </div>
              <div className="text-sm text-slate-600">{MISSION_TYPE_LABELS[booking.missionType]}</div>
            </div>

            {aircraft ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <Plane className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                <span className="font-medium text-navy-900">{aircraft.name}</span>
                {aircraft.manufacturer || aircraft.model ? (
                  <span>
                    {aircraft.manufacturer} {aircraft.model}
                  </span>
                ) : null}
                {aircraft.registration ? (
                  <span className="spec-readout text-xs text-slate-400">{aircraft.registration}</span>
                ) : null}
                <span className="text-xs text-slate-400">· {aircraft.passengerCapacity} seats</span>
              </div>
            ) : null}

            {booking.cancellationRequested ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                <span className="font-medium text-navy-900">Cancellation requested: </span>
                <span className="text-slate-600">{booking.cancellationReason}</span>
              </div>
            ) : null}

            {booking.modificationRequested ? (
              <div className="mt-6 rounded-lg border border-gold-200 bg-gold-200/10 p-4 text-sm">
                <span className="font-medium text-navy-900">Modification requested: </span>
                <span className="text-slate-600">{booking.modificationNotes}</span>
              </div>
            ) : null}

            {booking.specialRequests ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-medium text-navy-900">Special requests: </span>
                {booking.specialRequests}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-base font-semibold text-navy-900">Timeline</h3>
            <div className="mt-5">
              <BookingTimeline timeline={booking.timeline} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-base font-semibold text-navy-900">Update status</h3>
            <div className="mt-4">
              <BookingStatusActions
                bookingId={booking._id}
                currentStatus={booking.status}
                balanceAmount={booking.balanceAmount}
              />
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-base font-semibold text-navy-900">Customer</h3>
            {customer ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="font-medium text-navy-900">
                  {customer.firstName} {customer.lastName}
                </p>
                {customer.email ? (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                    <a href={`mailto:${customer.email}`} className="hover:text-sky-600">
                      {customer.email}
                    </a>
                  </div>
                ) : null}
                {customer.phone ? (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                    {customer.phone}
                  </div>
                ) : null}
                {customer.company ? (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                    {customer.company}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                This customer&apos;s account has been deleted.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-navy-950 to-navy-900 p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white">Payment</h3>
              <BookingPaymentStatusBadge status={paymentStatus} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Total</dt>
                <dd className="spec-readout font-medium text-white">
                  {formatCurrency(booking.totalAmount, booking.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Paid</dt>
                <dd className="spec-readout font-medium text-white">
                  {formatCurrency(booking.paidAmount, booking.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <dt className="text-slate-300">Balance</dt>
                <dd className="spec-readout text-lg font-semibold text-sky-400">
                  {formatCurrency(booking.balanceAmount, booking.currency)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}