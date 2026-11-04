import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { CustomerBookingStatusBadge } from "./CustomerBookingStatusBadge";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { formatCurrency, calculatePaymentProgress } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { IBooking } from "@/types/booking";

interface AirportNameInfo { name: string; city: string }

/**
 * Premium booking ledger for larger screens. BookingCard continues to handle
 * the mobile (< md) view; both read from the same booking list so there is a
 * single source of truth, no separate fetch.
 *
 * NOTE: BookingsLoading (app/(customer)/dashboard/bookings/loading.tsx)
 * mirrors this table's column widths, paddings and radii so the skeleton
 * swaps in without any layout shift — keep the two in step.
 */
export function BookingsTable({ bookings, airportNames = {} }: { bookings: IBooking[]; airportNames?: Record<string, AirportNameInfo> }) {
  return (
    <div className="relative hidden overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_24px_48px_-28px_rgba(15,23,42,0.18)] ring-1 ring-navy-900/[0.07] md:block">
      {/* Emerald hairline along the top edge — the one quiet flourish */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--bk-500))] to-transparent opacity-70"
        aria-hidden="true"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-navy-900/[0.07] bg-slate-50/70 text-[10px] uppercase tracking-[0.22em] text-slate-500">
              <th scope="col" className="whitespace-nowrap px-6 py-4 font-medium">Booking</th>
              <th scope="col" className="min-w-[280px] px-5 py-4 font-medium">Route</th>
              <th scope="col" className="whitespace-nowrap px-5 py-4 font-medium">Departure</th>
              <th scope="col" className="whitespace-nowrap px-5 py-4 font-medium">Status</th>
              <th scope="col" className="whitespace-nowrap px-5 py-4 font-medium">Paid</th>
              <th scope="col" className="whitespace-nowrap px-5 py-4 text-right font-medium">Total</th>
              <th scope="col" className="w-14 px-4 py-4" aria-hidden="true" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/[0.06]">
            {bookings.map((booking) => {
              const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
              const progress = calculatePaymentProgress(booking.totalAmount, booking.paidAmount);
              const departureInfo = airportNames[booking.departureAirportCode.toUpperCase()];
              const destinationInfo = airportNames[booking.destinationAirportCode.toUpperCase()];
              const href = `/dashboard/bookings/${booking._id}`;

              return (
                <tr
                  key={booking._id}
                  className="group relative transition-colors duration-300 hover:bg-[rgb(var(--bk-50)/0.55)]"
                >
                  <td className="relative px-6 py-6">
                    {/* Emerald rail that slides in on hover */}
                    <span
                      className="absolute inset-y-3 left-0 w-[3px] origin-center scale-y-0 rounded-r-full bg-[rgb(var(--bk-500))] transition-transform duration-300 group-hover:scale-y-100"
                      aria-hidden="true"
                    />
                    <Link
                      href={href}
                      className="spec-readout whitespace-nowrap text-sm font-medium text-navy-900 transition-colors group-hover:text-[rgb(var(--bk-600))]"
                    >
                      {booking.bookingNumber}
                    </Link>
                    {aircraftName ? <p className="mt-1 whitespace-nowrap text-xs text-slate-500">{aircraftName}</p> : null}
                  </td>
                  <td className="min-w-[280px] px-5 py-6">
                    <RouteDisplay
                      className="[&_.font-editorial]:!leading-snug [&_[aria-label=to]]:!text-[rgb(var(--bk-500))] [&_[aria-label=to]]:!not-italic"
                      size="sm"
                      departure={{ code: booking.departureAirportCode, name: departureInfo }}
                      destination={{ code: booking.destinationAirportCode, name: destinationInfo }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-5 py-6 text-sm text-slate-600">{formatDate(booking.departureDate)}</td>
                  <td className="px-5 py-6">
                    <CustomerBookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-5 py-6">
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <div
                        className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200/70"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        aria-label={`Paid ${progress}%`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--bk-400))] to-[rgb(var(--bk-600))]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="spec-readout text-xs text-slate-500">{progress}%</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-6 text-right">
                    <span className="spec-readout text-sm font-semibold text-navy-900">
                      {formatCurrency(booking.totalAmount, booking.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <Link
                      href={href}
                      aria-label={`View booking ${booking.bookingNumber}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-navy-900/10 bg-white text-slate-400 transition-all duration-300 group-hover:border-[rgb(var(--bk-500))] group-hover:bg-[rgb(var(--bk-500))] group-hover:text-white"
                    >
                      <CaretRight
                        className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-px"
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
    </div>
  );
}