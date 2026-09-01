import Link from "next/link";
import { AirplaneTakeoff, CalendarBlank, Users, CaretRight, Ticket as TicketIcon } from "@phosphor-icons/react/dist/ssr";
import { CustomerBookingStatusBadge } from "./CustomerBookingStatusBadge";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { formatCurrency, calculatePaymentProgress, getBookingPaymentStatus } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { IBooking } from "@/types/booking";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";

interface AirportNameInfo { name: string; city: string }

export function BookingCard({
  booking,
  hasTicket = false,
  airportNames = {},
}: {
  booking: IBooking;
  hasTicket?: boolean;
  airportNames?: Record<string, AirportNameInfo>;
}) {
  const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
  const departureInfo = airportNames[booking.departureAirportCode.toUpperCase()];
  const destinationInfo = airportNames[booking.destinationAirportCode.toUpperCase()];
  const progress = calculatePaymentProgress(booking.totalAmount, booking.paidAmount);
  const paymentStatus = getBookingPaymentStatus(booking.totalAmount, booking.paidAmount);
  const isTerminal = booking.status === BOOKING_STATUSES.COMPLETED || booking.status === BOOKING_STATUSES.CANCELLED;
  const needsPayment = !isTerminal && paymentStatus !== "paid" && booking.balanceAmount > 0;

  return (
    <Link
      href={`/dashboard/bookings/${booking._id}`}
      className={`relative flex flex-col gap-0 overflow-hidden rounded-2xl bg-white shadow-sm ${
        needsPayment ? "ring-1 ring-sky-300/60" : ""
      }`}
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Payment urgency banner */}
      {needsPayment ? (
        <div className="flex items-center gap-2 border-b border-sky-200 bg-sky-50 px-5 py-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
          </span>
          <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
            {formatCurrency(booking.balanceAmount, booking.currency)} due
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-950 text-white">
              <AirplaneTakeoff className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="spec-readout text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {booking.bookingNumber}
              </p>
              <RouteDisplay
                className="mt-0.5"
                size="sm"
                departure={{ code: booking.departureAirportCode, name: departureInfo }}
                destination={{ code: booking.destinationAirportCode, name: destinationInfo }}
              />
              {aircraftName ? (
                <p className="mt-0.5 text-xs text-slate-500">{aircraftName}</p>
              ) : null}
            </div>
          </div>
          <CaretRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CalendarBlank className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(booking.departureDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {booking.passengerCount} {booking.passengerCount === 1 ? "passenger" : "passengers"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <CustomerBookingStatusBadge status={booking.status} />
            {hasTicket ? (
              <span className="flex items-center gap-1 rounded-full bg-champagne-500/10 px-2 py-0.5 text-[10px] font-medium text-champagne-600">
                <TicketIcon className="h-3 w-3" aria-hidden="true" />
                Ticket ready
              </span>
            ) : null}
          </div>
          <div className="text-right">
            <p className="spec-readout text-sm font-semibold text-navy-900">
              {formatCurrency(booking.totalAmount, booking.currency)}
            </p>
            {!isTerminal ? (
              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-sky-500"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">{progress}%</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}