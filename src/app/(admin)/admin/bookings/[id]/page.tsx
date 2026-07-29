import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Users, Mail, Phone } from "lucide-react";
import { DetailHeader } from "@/components/admin/layout/DetailHeader";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingTimeline } from "@/components/booking/BookingTimeline/BookingTimeline";
import { BookingStatusActions } from "@/components/admin/dialogs/BookingStatusActions";
import { getBookingForAdmin } from "@/features/admin/lib/getBookingsForAdmin";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
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

  const customer =
    typeof booking.customer === "object" && booking.customer !== null
      ? (booking.customer as unknown as { firstName?: string; lastName?: string; email?: string; phone?: string })
      : null;
  const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;

  return (
    <div>
      <DetailHeader
        backHref="/admin/bookings"
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
                <CalendarDays className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {formatDate(booking.departureDate)}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {booking.passengerCount} passengers
              </div>
              {aircraftName ? <div className="text-sm text-slate-600">{aircraftName}</div> : null}
            </div>

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

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <h3 className="font-display text-base font-semibold text-navy-900">Timeline</h3>
            <div className="mt-5">
              <BookingTimeline timeline={booking.timeline} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <h3 className="font-display text-base font-semibold text-navy-900">Update status</h3>
            <div className="mt-4">
              <BookingStatusActions bookingId={booking._id} currentStatus={booking.status} />
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
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
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                This customer&apos;s account has been deleted.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-navy-950 to-navy-900 p-7 shadow-soft">
            <h3 className="font-display text-base font-semibold text-white">Payment</h3>
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