import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  AirplaneTakeoff,
  Pulse,
  ArrowRight,
  CalendarBlank,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react/dist/ssr";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { AnalyticsBarChart } from "@/components/admin/charts/AnalyticsBarChart";
import { DonutStat } from "@/components/admin/dashboard/DonutStat";
import { Sparkline } from "@/components/admin/dashboard/Sparkline";
import { FlightSummaryCard } from "@/components/admin/dashboard/FlightSummaryCard";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { BookingPaymentStatusBadge } from "@/components/booking/BookingCard/BookingPaymentStatusBadge";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import type { MonthlyPoint } from "@/features/admin/lib/getAnalytics";
import {
  getDashboardCounts,
  getRevenueSummary,
  getRevenueByMonth,
  getCustomerGrowth,
  getFlightsByMonth,
} from "@/features/admin/lib/getAnalytics";
import {
  getOperationsSummary,
  getUpcomingFlights,
  getOutstandingPayments,
  getTopCustomers,
  getRecentActivity,
} from "@/features/admin/lib/getOperationsDashboard";
import { getPaymentSummary } from "@/features/admin/lib/getPaymentsForAdmin";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { formatCurrency, getBookingPaymentStatus } from "@/utils/currency";
import { formatDateTime, formatRelativeTime } from "@/utils/date";

export const metadata: Metadata = { title: "Admin Overview" };

function computeTrend(
  points: MonthlyPoint[]
): { direction: "up" | "down" | "flat"; pct: number } {
  if (points.length < 2) return { direction: "flat", pct: 0 };
  const previous = points[points.length - 2].value;
  const latest = points[points.length - 1].value;
  if (previous === 0) return { direction: latest > 0 ? "up" : "flat", pct: 0 };
  const pct = ((latest - previous) / previous) * 100;
  return { direction: pct >= 0 ? "up" : "down", pct: Math.abs(pct) };
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function AdminDashboardPage() {
  const [
    counts,
    revenue,
    revenueSeries,
    customerSeries,
    flightsSeries,
    ops,
    upcomingFlights,
    outstandingPayments,
    topCustomers,
    activity,
    paymentSummary,
  ] = await Promise.all([
    getDashboardCounts(),
    getRevenueSummary(),
    getRevenueByMonth(),
    getCustomerGrowth(),
    getFlightsByMonth(),
    getOperationsSummary(),
    getUpcomingFlights(6),
    getOutstandingPayments(6),
    getTopCustomers(3),
    getRecentActivity(8),
    getPaymentSummary(),
  ]);

  const upcomingCodes = upcomingFlights.flatMap((b) => [
    b.departureAirportCode,
    b.destinationAirportCode,
  ]);
  const airportNames = await getAirportNamesByCodes(upcomingCodes);

  const revenueTrend = computeTrend(revenueSeries);
  const customerTrend = computeTrend(customerSeries);

  const bookingsTotalKnown =
    ops.pendingBookings + ops.confirmedBookings + ops.inProgressBookings + ops.completedBookings;
  const confirmedRate =
    bookingsTotalKnown > 0 ? (ops.confirmedBookings / bookingsTotalKnown) * 100 : 0;
  const paymentsCompletedRate =
    paymentSummary.total > 0 ? (paymentSummary.completed / paymentSummary.total) * 100 : 0;
  const quotesDenom = ops.pendingQuotes + ops.approvedAwaitingDecision;
  const awaitingRate =
    quotesDenom > 0 ? (ops.approvedAwaitingDecision / quotesDenom) * 100 : 0;

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Dashboard Overview</h1>

      {/* ── Top two-column grid ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* LEFT — spans 2 cols */}
        <div className="space-y-5 xl:col-span-2">

          {/* Analytics bar chart */}
          <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Analytics</h2>
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                style={{ background: "#2d5a3d" }}
              >
                <CalendarBlank className="h-3 w-3" aria-hidden="true" />
                3 Months
              </span>
            </div>
            <div className="mt-3">
              <AnalyticsBarChart data={revenueSeries.slice(-3)} formatAsCurrency />
            </div>
          </div>

          {/* Visitors — 2×2 grid */}
          <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="text-sm font-semibold text-slate-700">Visitors</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
              <VisitorStat
                value={formatCompact(counts.totalCustomers)}
                sublabel="Total customers"
                values={customerSeries.map((p) => p.value)}
                trend={customerTrend}
                color="#2d5a3d"
              />
              <VisitorStat
                value={formatCurrency(revenue.thisMonthRevenue)}
                sublabel="This month revenue"
                values={revenueSeries.map((p) => p.value)}
                trend={revenueTrend}
                color="#7bb3a0"
              />
              <VisitorStat
                value={formatCompact(revenue.totalRevenue)}
                sublabel="Total revenue"
                values={revenueSeries.map((p) => p.value)}
                trend={revenueTrend}
                color="#9b8ec4"
              />
              <VisitorStat
                value={String(ops.upcomingFlightsCount)}
                sublabel="Upcoming flights"
                values={flightsSeries.map((p) => p.value)}
                trend={computeTrend(flightsSeries)}
                color="#e8a838"
              />
            </div>
          </div>

          {/* At a glance — donuts */}
          <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="text-sm font-semibold text-slate-700">At a glance</h2>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <DonutStat
                percent={confirmedRate}
                color="#e8a838"
                label="Bookings confirmed"
                detail={`${ops.confirmedBookings} of ${bookingsTotalKnown}`}
              />
              <DonutStat
                percent={paymentsCompletedRate}
                color="#9b8ec4"
                label="Payments completed"
                detail={`${paymentSummary.completed} of ${paymentSummary.total}`}
              />
              <DonutStat
                percent={awaitingRate}
                color="#5bbfb5"
                label="Quotes awaiting"
                detail={`${ops.approvedAwaitingDecision} of ${quotesDenom}`}
              />
            </div>
          </div>
        </div>

        {/* RIGHT col */}
        <div className="space-y-5">

          {/* This month */}
          <FlightSummaryCard
            confirmed={ops.confirmedBookings}
            outstanding={ops.outstandingBookingsCount}
            upcoming={ops.upcomingFlightsCount}
            initialMonthlyData={revenueSeries.map((p) => ({ label: p.month, value: p.value }))}
          />

          {/* Top lists */}
          <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="text-sm font-semibold text-slate-700">Top lists</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold" style={{ color: "#2d5a3d" }}>
                  Top Flights
                </p>
                <ol className="mt-2.5 space-y-2.5">
                  {upcomingFlights.slice(0, 3).map((booking, i) => (
                    <li key={booking._id} className="flex items-start gap-2 text-xs">
                      <span className="mt-0.5 shrink-0 font-semibold text-slate-400">{i + 1}.</span>
                      <Link
                        href={`/admin/bookings/${booking._id}`}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        {booking.departureAirportCode} → {booking.destinationAirportCode}
                      </Link>
                    </li>
                  ))}
                  {upcomingFlights.length === 0 && (
                    <li className="text-xs text-slate-400">No upcoming flights</li>
                  )}
                </ol>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Top Client</p>
                <ol className="mt-2.5 space-y-2.5">
                  {topCustomers.map((customer, i) => (
                    <li key={customer.customerId} className="flex items-start gap-2 text-xs">
                      <span className="mt-0.5 shrink-0 font-semibold text-slate-400">{i + 1}.</span>
                      <Link
                        href={`/admin/customers/${customer.customerId}`}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        {`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "—"}
                      </Link>
                    </li>
                  ))}
                  {topCustomers.length === 0 && (
                    <li className="text-xs text-slate-400">No completed payments yet</li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top-line totals ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total revenue" value={formatCurrency(revenue.totalRevenue)} />
        <StatCard label="Total customers" value={String(counts.totalCustomers)} />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(ops.totalOutstandingBalance)}
          hint={`${ops.outstandingBookingsCount} booking${ops.outstandingBookingsCount === 1 ? "" : "s"}`}
        />
        <StatCard label="Upcoming flights" value={String(ops.upcomingFlightsCount)} />
      </div>

      {/* ── Quotes ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Quotes</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCardLink href="/admin/quotes?status=pending" label="Pending review" value={String(counts.pendingQuotes)} />
          <StatCardLink href="/admin/quotes?status=approved" label="Awaiting customer decision" value={String(ops.approvedAwaitingDecision)} />
          <StatCardLink href="/admin/quotes?status=approved" label="Expiring within 7 days" value={String(ops.expiringQuotes)} />
        </div>
      </div>

      {/* ── Bookings ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Bookings</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCardLink href="/admin/bookings?status=pending" label="Pending" value={String(ops.pendingBookings)} />
          <StatCardLink href="/admin/bookings?status=confirmed" label="Confirmed" value={String(ops.confirmedBookings)} />
          <StatCardLink href="/admin/bookings?status=in_progress" label="In progress" value={String(ops.inProgressBookings)} />
        </div>
      </div>

      {/* ── Payments ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Payments</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCardLink href="/admin/payments?status=processing" label="In progress" value={String(paymentSummary.inProgress)} />
          <StatCardLink href="/admin/payments?status=failed" label="Failed" value={String(paymentSummary.failed)} />
        </div>
      </div>

      {/* ── Upcoming flights ── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Upcoming flights</h2>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: "#2d5a3d" }}
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4">
          {upcomingFlights.length === 0 ? (
            <EmptyState
              icon={<AirplaneTakeoff className="h-5 w-5" aria-hidden="true" />}
              title="No upcoming flights"
              description="Confirmed and pending bookings with a future departure date will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingFlights.map((booking) => {
                const customer =
                  typeof booking.customer === "object" ? booking.customer : null;
                const aircraftName =
                  typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
                const paymentStatus = getBookingPaymentStatus(
                  booking.totalAmount,
                  booking.paidAmount
                );
                return (
                  <Link
                    key={booking._id}
                    href={`/admin/bookings/${booking._id}`}
                    className="flex flex-col gap-2 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <RouteDisplay
                        eyebrow={booking.bookingNumber}
                        departure={{
                          code: booking.departureAirportCode,
                          name: airportNames[booking.departureAirportCode],
                        }}
                        destination={{
                          code: booking.destinationAirportCode,
                          name: airportNames[booking.destinationAirportCode],
                        }}
                        size="sm"
                      />
                      {(customer || aircraftName) && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {customer
                            ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
                            : "—"}
                          {aircraftName ? ` · ${aircraftName}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        {formatDateTime(booking.departureDate)}
                      </span>
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

      {/* ── Bottom two-col ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Outstanding payments */}
        <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Outstanding payments</h2>
            <Link
              href="/admin/bookings?payment=unpaid"
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: "#2d5a3d" }}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4">
            {outstandingPayments.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
                title="No outstanding payments"
                description="Every active booking is fully paid."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {outstandingPayments.map((booking) => {
                  const customer =
                    typeof booking.customer === "object" ? booking.customer : null;
                  const paymentStatus = getBookingPaymentStatus(
                    booking.totalAmount,
                    booking.paidAmount
                  );
                  return (
                    <Link
                      key={booking._id}
                      href={`/admin/bookings/${booking._id}`}
                      className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{booking.bookingNumber}</p>
                        <p className="text-xs text-slate-500">
                          {customer
                            ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">
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

        {/* Recent activity */}
        <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-semibold text-slate-700">Recent activity</h2>
          <div className="mt-4">
            {activity.length === 0 ? (
              <EmptyState
                icon={<Pulse className="h-5 w-5" aria-hidden="true" />}
                title="No recent activity"
                description="Quote, booking, and payment events will show up here as they happen."
              />
            ) : (
              <ul className="space-y-3.5">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-2 py-1 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
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
    </div>
  );
}

/* ── Sub-components ── */

function VisitorStat({
  value,
  sublabel,
  values,
  trend,
  color,
}: {
  value: string;
  sublabel: string;
  values: number[];
  trend: { direction: "up" | "down" | "flat"; pct: number };
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-lg font-bold text-slate-800">{value}</p>
        <p className="mt-0.5 text-xs text-slate-500">{sublabel}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Sparkline values={values} color={color} />
        {trend.direction !== "flat" && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              trend.direction === "up"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
            ) : (
              <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
            )}
            {trend.pct.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}

function StatCardLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <Link href={href} className="block">
      <StatCard label={label} value={value} />
    </Link>
  );
}