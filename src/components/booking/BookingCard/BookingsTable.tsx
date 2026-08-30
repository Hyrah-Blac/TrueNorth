import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { CustomerBookingStatusBadge } from "./CustomerBookingStatusBadge";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { formatCurrency, calculatePaymentProgress } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { IBooking } from "@/types/booking";

interface AirportNameInfo { name: string; city: string }

/**
 * Stripe-dashboard-style table for larger screens. BookingCard continues
 * to handle the mobile (< md) view; both read from the same booking list
 * so there is a single source of truth, no separate fetch.
 */
export function BookingsTable({ bookings, airportNames = {} }: { bookings: IBooking[]; airportNames?: Record<string, AirportNameInfo> }) {
  return (
    <div className="hidden border-t border-slate-100 md:block">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-widest2 text-slate-500">
            <th scope="col" className="px-6 py-4 font-medium">Booking</th>
            <th scope="col" className="px-6 py-4 font-medium">Route</th>
            <th scope="col" className="px-6 py-4 font-medium">Departure</th>
            <th scope="col" className="px-6 py-4 font-medium">Status</th>
            <th scope="col" className="px-6 py-4 font-medium">Paid</th>
            <th scope="col" className="px-6 py-4 text-right font-medium">Total</th>
            <th scope="col" className="w-10 px-4 py-4" aria-hidden="true" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((booking) => {
            const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
            const progress = calculatePaymentProgress(booking.totalAmount, booking.paidAmount);
            const departureInfo = airportNames[booking.departureAirportCode.toUpperCase()];
            const destinationInfo = airportNames[booking.destinationAirportCode.toUpperCase()];

            return (
              <tr key={booking._id} className="group transition-colors hover:bg-sky-500/[0.04]">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/bookings/${booking._id}`}
                    className="spec-readout text-sm font-medium text-navy-900 transition-colors group-hover:text-sky-600"
                  >
                    {booking.bookingNumber}
                  </Link>
                  {aircraftName ? <p className="mt-0.5 text-xs text-slate-500">{aircraftName}</p> : null}
                </td>
                <td className="px-6 py-4">
                  <RouteDisplay
                    size="sm"
                    departure={{ code: booking.departureAirportCode, name: departureInfo }}
                    destination={{ code: booking.destinationAirportCode, name: destinationInfo }}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(booking.departureDate)}</td>
                <td className="px-6 py-4">
                  <CustomerBookingStatusBadge status={booking.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${progress >= 100 ? "bg-green-500" : "bg-sky-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="spec-readout text-xs text-slate-500">{progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="spec-readout text-sm font-semibold text-navy-900">
                    {formatCurrency(booking.totalAmount, booking.currency)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Link href={`/dashboard/bookings/${booking._id}`} aria-label={`View booking ${booking.bookingNumber}`}>
                    <CaretRight
                      className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-sky-500"
                      aria-hidden="true"
                    />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}