import Link from "next/link";
import { CaretRight, Ticket as TicketIcon } from "@phosphor-icons/react/dist/ssr";
import { CustomerBookingStatusBadge } from "./CustomerBookingStatusBadge";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { formatCurrency, calculatePaymentProgress } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import type { IBooking } from "@/types/booking";

interface AirportNameInfo { name: string; city: string }

/**
 * One row, every breakpoint — same pattern as PaymentRow. Below lg it
 * stacks: identity + total share the top line, a hairline separates the
 * route, then date · status. At lg+ it becomes a four-column grid —
 * Booking / Route / Departure + status / Total + paid — so the list reads
 * evenly with no horizontal scrolling at any width.
 *
 * Each row is its own rounded, softly-shadowed card and the whole card is
 * the link — the same quiet shell as PaymentRow (rounded-2xl, shadow-sm,
 * hairline border, no hover effects). The emerald accent is kept to the
 * progress bar.
 *
 * bookings/loading.tsx mirrors this layout — keep the two in step.
 */
export function BookingRow({
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
  const isTerminal = booking.status === BOOKING_STATUSES.COMPLETED || booking.status === BOOKING_STATUSES.CANCELLED;

  const amount = (
    <span className="spec-readout text-base font-semibold text-navy-900 sm:text-[15px]">
      {formatCurrency(booking.totalAmount, booking.currency)}
    </span>
  );

  const chevron = (
    <CaretRight
      className="h-4 w-4 shrink-0 text-slate-300"
      aria-hidden="true"
    />
  );

  return (
    <Link
      href={`/dashboard/bookings/${booking._id}`}
      className="flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_150px_150px] lg:items-center lg:gap-6"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Identity — booking number + aircraft; total pinned alongside on < lg */}
      <div className="flex items-start justify-between gap-4 lg:block">
        <div className="min-w-0">
          <p className="spec-readout text-[11px] text-slate-400">{booking.bookingNumber}</p>
          <p className="mt-0.5 truncate font-editorial text-xl font-light text-navy-900">
            {aircraftName ?? "Charter flight"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {amount}
          {chevron}
        </div>
      </div>

      {/* Route */}
      <div className="border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
        <RouteDisplay
          size="sm"
          className="[&_[aria-label=to]]:!text-[rgb(var(--bk-500))]"
          departure={{ code: booking.departureAirportCode, name: departureInfo }}
          destination={{ code: booking.destinationAirportCode, name: destinationInfo }}
        />
      </div>

      {/* Departure + status */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 lg:flex-col lg:items-start lg:gap-y-2">
        <span className="text-sm text-slate-500">{formatDate(booking.departureDate)}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CustomerBookingStatusBadge status={booking.status} />
          {hasTicket ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[rgb(var(--bk-600))]">
              <TicketIcon className="h-3 w-3" aria-hidden="true" />
              Ticket
            </span>
          ) : null}
        </div>
      </div>

      {/* Total + paid (lg+) */}
      <div className="hidden items-center justify-end gap-3 lg:flex">
        <div className="text-right">
          {amount}
          {!isTerminal ? (
            <div className="mt-2 flex items-center justify-end gap-2">
              <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-[rgb(var(--bk-500))]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="spec-readout text-[11px] text-slate-400">{progress}%</span>
            </div>
          ) : null}
        </div>
        {chevron}
      </div>
    </Link>
  );
}