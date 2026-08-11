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
      className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-soft transition-all duration-300 hover:border-sky-200 hover:shadow-lifted sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Left — icon + identity */}
      <div className="flex items-center gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
          style={{
            background: "linear-gradient(135deg, rgb(219 229 247) 0%, rgb(189 205 241) 100%)",
            color: "rgb(30 58 128)",
            boxShadow: "0 1px 4px rgb(43 91 191 / 0.15)",
          }}
        >
          <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <p className="spec-readout text-[11px] text-slate-400">{booking.bookingNumber}</p>
          <p className="mt-0.5 truncate font-editorial text-lg font-light text-navy-900 transition-colors group-hover:text-sky-700">
            {customer ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() : "—"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span className="spec-readout">{booking.departureAirportCode} → {booking.destinationAirportCode}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>{formatDate(booking.departureDate)}</span>
            {aircraftName ? (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>{aircraftName}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right — amount + statuses + caret */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="spec-readout text-base font-semibold text-navy-900">
            {formatCurrency(booking.totalAmount, booking.currency)}
          </p>
          {booking.balanceAmount > 0 ? (
            <p className="spec-readout text-[10px] text-slate-400">
              {formatCurrency(booking.balanceAmount, booking.currency)} due
            </p>
          ) : null}
        </div>
        <BookingPaymentStatusBadge status={paymentStatus} />
        <BookingStatusBadge status={booking.status} />
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-500"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}