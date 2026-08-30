import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingPaymentStatusBadge } from "@/components/booking/BookingCard/BookingPaymentStatusBadge";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { formatCurrency, getBookingPaymentStatus } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { IBooking } from "@/types/booking";

interface AirportNameInfo { name: string; city: string }

// Divided list row, same shape as the customer-side QuoteRow
// (dashboard/quotes/page.tsx) — no card border, a soft hover wash, and an
// absolutely-positioned caret so it doesn't consume layout space.
export function AdminBookingRow({ booking, airportNames = {} }: { booking: IBooking; airportNames?: Record<string, AirportNameInfo> }) {
  const customer = typeof booking.customer === "object" && booking.customer !== null ? booking.customer : null;
  const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
  const paymentStatus = getBookingPaymentStatus(booking.totalAmount, booking.paidAmount);
  const departureInfo = airportNames[booking.departureAirportCode.toUpperCase()];
  const destinationInfo = airportNames[booking.destinationAirportCode.toUpperCase()];

  return (
    <Link
      href={`/admin/bookings/${booking._id}`}
      className="group relative -mx-3 flex flex-col gap-3 rounded-lg px-3 py-5 pr-8 transition-colors hover:bg-sky-500/[0.035] sm:flex-row sm:items-center sm:justify-between sm:pr-9"
    >
      <div className="min-w-0">
        <p className="spec-readout text-[11px] text-slate-400">{booking.bookingNumber}</p>
        <p className="mt-0.5 truncate font-editorial text-xl font-light text-navy-900">
          {customer ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() : "—"}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <RouteDisplay
            size="sm"
            departure={{ code: booking.departureAirportCode, name: departureInfo }}
            destination={{ code: booking.destinationAirportCode, name: destinationInfo }}
          />
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

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="spec-readout text-sm font-semibold text-navy-900">
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
      </div>

      <CaretRight
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-sky-500 sm:right-1.5"
        aria-hidden="true"
      />
    </Link>
  );
}