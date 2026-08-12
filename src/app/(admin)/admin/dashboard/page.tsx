import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  FileText,
  CalendarCheck,
  Users,
  ArrowRight,
  AirplaneTakeoff,
  ClockCountdown,
  CheckCircle,
  HourglassMedium,
  Timer,
  Pulse,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LazyTrendChart as TrendChart } from "@/components/admin/charts/LazyTrendChart";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingPaymentStatusBadge } from "@/components/booking/BookingCard/BookingPaymentStatusBadge";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import {
  getDashboardCounts,
  getRevenueSummary,
  getRevenueByMonth,
  getCustomerGrowth,
} from "@/features/admin/lib/getAnalytics";
import {
  getOperationsSummary,
  getUpcomingFlights,
  getOutstandingPayments,
  getRecentActivity,
} from "@/features/admin/lib/getOperationsDashboard";
import { getPaymentSummary } from "@/features/admin/lib/getPaymentsForAdmin";
import { formatCurrency, getBookingPaymentStatus } from "@/utils/currency";
import { formatDateTime, formatRelativeTime } from "@/utils/date";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminDashboardPage() {
  const [counts, revenue, revenueSeries, customerSeries, ops, upcomingFlights, outstandingPayments, activity, paymentSummary] =
    await Promise.all([
      getDashboardCounts(),
      getRevenueSummary(),
      getRevenueByMonth(),
      getCustomerGrowth(),
      getOperationsSummary(),
      getUpcomingFlights(6),
      getOutstandingPayments(6),
      getRecentActivity(8),
      getPaymentSummary(),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="A snapshot of what needs attention today, plus revenue and customer activity across the business."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total revenue" value={formatCurrency(revenue.totalRevenue)} icon={Wallet} />
        <StatCard label="Total customers" value={String(counts.totalCustomers)} icon={Users} />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(ops.totalOutstandingBalance)}
          hint={`${ops.outstandingBookingsCount} booking${ops.outstandingBookingsCount === 1 ? "" : "s"}`}
          icon={Wallet}
        />
        <StatCard label="Upcoming flights" value={String(ops.upcomingFlightsCount)} icon={AirplaneTakeoff} />
      </div>

      {/* Operations — what needs attention right now, grouped and linked to the filtered list that handles it. */}
      <div>
        <h2 className="font-editorial text-lg font-light text-navy-900">Quotes</h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCardLink
            href="/admin/quotes?status=pending"
            label="Pending review"
            value={String(counts.pendingQuotes)}
            icon={FileText}
          />
          <StatCardLink
            href="/admin/quotes?status=approved"
            label="Awaiting customer decision"
            value={String(ops.approvedAwaitingDecision)}
            icon={HourglassMedium}
          />
          <StatCardLink
            href="/admin/quotes?status=approved"
            label="Expiring within 7 days"
            value={String(ops.expiringQuotes)}
            icon={ClockCountdown}
          />
        </div>
      </div>

      <div>
        <h2 className="font-editorial text-lg font-light text-navy-900">Bookings</h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCardLink
            href="/admin/bookings?status=pending"
            label="Pending"
            value={String(ops.pendingBookings)}
            icon={CalendarCheck}
          />
          <StatCardLink
            href="/admin/bookings?status=confirmed"
            label="Confirmed"
            value={String(ops.confirmedBookings)}
            icon={CheckCircle}
          />
          <StatCardLink
            href="/admin/bookings?status=in_progress"
            label="In progress"
            value={String(ops.inProgressBookings)}
            icon={Timer}
          />
        </div>
      </div>

      <div>
        <h2 className="font-editorial text-lg font-light text-navy-900">Payments</h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatCardLink
            href="/admin/payments?status=processing"
            label="In progress"
            value={String(paymentSummary.inProgress)}
            icon={HourglassMedium}
          />
          <StatCardLink
            href="/admin/payments?status=failed"
            label="Failed"
            value={String(paymentSummary.failed)}
            icon={XCircle}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-lg font-light text-navy-900">Upcoming flights</h2>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5">
          {upcomingFlights.length === 0 ? (
            <EmptyState
              icon={<AirplaneTakeoff className="h-5 w-5" aria-hidden="true" />}
              title="No upcoming flights"
              description="Confirmed and pending bookings with a future departure date will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingFlights.map((booking) => {
                const customer = typeof booking.customer === "object" ? booking.customer : null;
                const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
                const paymentStatus = getBookingPaymentStatus(booking.totalAmount, booking.paidAmount);

                return (
                  <Link
                    key={booking._id}
                    href={`/admin/bookings/${booking._id}`}
                    className="flex flex-col gap-2 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="spec-readout text-sm font-medium text-navy-900">
                        {booking.bookingNumber} · {booking.departureAirportCode} → {booking.destinationAirportCode}
                      </p>
                      <p className="text-xs text-slate-500">
                        {customer ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() : "—"}
                        {aircraftName ? ` · ${aircraftName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{formatDateTime(booking.departureDate)}</span>
                      <BookingPaymentStatusBadge status={paymentStatus} />
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-lg font-light text-navy-900">Outstanding payments</h2>
            <Link
              href="/admin/bookings?payment=unpaid"
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5">
            {outstandingPayments.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
                title="No outstanding payments"
                description="Every active booking is fully paid."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {outstandingPayments.map((booking) => {
                  const customer = typeof booking.customer === "object" ? booking.customer : null;
                  const paymentStatus = getBookingPaymentStatus(booking.totalAmount, booking.paidAmount);

                  return (
                    <Link
                      key={booking._id}
                      href={`/admin/bookings/${booking._id}`}
                      className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-slate-50"
                    >
                      <div>
                        <p className="spec-readout text-sm font-medium text-navy-900">{booking.bookingNumber}</p>
                        <p className="text-xs text-slate-500">
                          {customer ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="spec-readout text-sm font-semibold text-navy-900">
                          {formatCurrency(booking.balanceAmount, booking.currency)} due
                        </p>
                        <BookingPaymentStatusBadge status={paymentStatus} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <h2 className="font-editorial text-lg font-light text-navy-900">Recent activity</h2>

          <div className="mt-5">
            {activity.length === 0 ? (
              <EmptyState
                icon={<Pulse className="h-5 w-5" aria-hidden="true" />}
                title="No recent activity"
                description="Quote, booking, and payment events will show up here as they happen."
              />
            ) : (
              <ul className="space-y-4">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block rounded-md transition-colors hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-navy-900">{item.label}</p>
                        <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(item.timestamp)}</span>
                      </div>
                      <p className="spec-readout text-xs text-slate-500">
                        {item.reference}
                        {item.actor ? ` · ${item.actor}` : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <h2 className="font-editorial text-lg font-light text-navy-900">Revenue (6 months)</h2>
          <p className="text-xs text-slate-500">This month: {formatCurrency(revenue.thisMonthRevenue)}</p>
          <div className="mt-5">
            <TrendChart data={revenueSeries} formatAsCurrency />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <h2 className="font-editorial text-lg font-light text-navy-900">Customer growth (6 months)</h2>
          <p className="text-xs text-slate-500">New customer accounts per month</p>
          <div className="mt-5">
            <TrendChart data={customerSeries} color="rgb(var(--color-gold-500))" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCardLink({
  href,
  label,
  value,
  icon,
}: {
  href: string;
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="block">
      <StatCard label={label} value={value} icon={icon} />
    </Link>
  );
}