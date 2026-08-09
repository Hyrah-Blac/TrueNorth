import Link from "next/link";
import { PlaneTakeoff, ArrowUpRight } from "lucide-react";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingPaymentStatusBadge } from "@/components/booking/BookingCard/BookingPaymentStatusBadge";
import { formatCurrency, getBookingPaymentStatus } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { IBooking } from "@/types/booking";

export function AdminBookingRow({ booking }: { booking: IBooking }) {
  const customer = typeof booking.customer === "object" && booking.customer !== null ? booking.customer : null;
  const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
  const paymentStatus = getBookingPaymentStatus(booking.totalAmount, booking.paidAmount);

  return (
    <Link
      href={`/admin/bookings/${booking._id}`}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:border-sky-300 hover:shadow-lifted sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
          <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="spec-readout text-sm font-medium text-navy-900">{booking.bookingNumber}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {customer ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() : "—"} ·{" "}
            {booking.departureAirportCode} → {booking.destinationAirportCode}
            {aircraftName ? ` · ${aircraftName}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(booking.departureDate)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="spec-readout text-sm font-semibold text-navy-900">
            {formatCurrency(booking.totalAmount, booking.currency)}
          </p>
          {booking.balanceAmount > 0 ? (
            <p className="spec-readout text-xs text-slate-500">
              {formatCurrency(booking.balanceAmount, booking.currency)} due
            </p>
          ) : null}
        </div>
        <BookingPaymentStatusBadge status={paymentStatus} />
        <BookingStatusBadge status={booking.status} />
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
      </div>
    </Link>
  );
}
