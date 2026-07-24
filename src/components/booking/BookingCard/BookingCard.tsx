import Link from "next/link";
import { PlaneTakeoff, ArrowUpRight } from "lucide-react";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { formatCurrency, calculatePaymentProgress } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { IBooking } from "@/types/booking";

export function BookingCard({ booking }: { booking: IBooking }) {
  const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
  const progress = calculatePaymentProgress(booking.totalAmount, booking.paidAmount);

  return (
    <Link
      href={`/dashboard/bookings/${booking._id}`}
      className="group flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lifted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
            <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="spec-readout text-sm font-medium text-navy-900">{booking.bookingNumber}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {booking.departureAirportCode} → {booking.destinationAirportCode}
              {aircraftName ? ` · ${aircraftName}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(booking.departureDate)}</p>
          </div>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500"
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <BookingStatusBadge status={booking.status} />
        <div className="text-right">
          <p className="spec-readout text-sm font-semibold text-navy-900">
            {formatCurrency(booking.totalAmount, booking.currency)}
          </p>
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${progress >= 100 ? "bg-green-500" : "bg-sky-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500">{progress}% paid</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
