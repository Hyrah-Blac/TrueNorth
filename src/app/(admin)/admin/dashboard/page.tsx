import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  FileText,
  CalendarCheck,
  Users,
  ArrowRight,
  AirplaneTakeoff,
} from "@phosphor-icons/react/dist/ssr";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { LazyTrendChart as TrendChart } from "@/components/admin/charts/LazyTrendChart";
import { BookingStatusBadge } from "@/components/booking/BookingCard/BookingStatusBadge";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import {
  getDashboardCounts,
  getRevenueSummary,
  getRevenueByMonth,
  getCustomerGrowth,
  getRecentBookings,
} from "@/features/admin/lib/getAnalytics";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminDashboardPage() {
  const [counts, revenue, revenueSeries, customerSeries, recentBookings] = await Promise.all([
    getDashboardCounts(),
    getRevenueSummary(),
    getRevenueByMonth(),
    getCustomerGrowth(),
    getRecentBookings(5),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total revenue" value={formatCurrency(revenue.totalRevenue)} icon={Wallet} />
        <StatCard label="Pending quotes" value={String(counts.pendingQuotes)} icon={FileText} />
        <StatCard label="Awaiting confirmation" value={String(counts.pendingBookingConfirmations)} icon={CalendarCheck} />
        <StatCard label="Total customers" value={String(counts.totalCustomers)} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h2 className="font-display text-base font-semibold text-navy-900">Revenue (6 months)</h2>
          <p className="text-xs text-slate-500">This month: {formatCurrency(revenue.thisMonthRevenue)}</p>
          <div className="mt-5">
            <TrendChart data={revenueSeries} valueFormatter={(v) => formatCurrency(v)} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h2 className="font-display text-base font-semibold text-navy-900">Customer growth (6 months)</h2>
          <p className="text-xs text-slate-500">New customer accounts per month</p>
          <div className="mt-5">
            <TrendChart data={customerSeries} color="rgb(var(--color-gold-500))" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-navy-900">Recent bookings</h2>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-sky-600 transition-colors hover:text-sky-700"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5">
          {recentBookings.length === 0 ? (
            <EmptyState
              icon={<AirplaneTakeoff className="h-5 w-5" aria-hidden="true" />}
              title="No bookings yet"
              description="Bookings created from approved quotes will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBookings.map((booking) => {
                const customer =
                  typeof booking.customer === "object" ? (booking.customer as unknown as { firstName?: string; lastName?: string }) : null;
                const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;

                return (
                  <div key={booking._id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="spec-readout text-sm font-medium text-navy-900">{booking.bookingNumber}</p>
                      <p className="text-xs text-slate-500">
                        {customer ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() : "—"}
                        {aircraftName ? ` · ${aircraftName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">{formatDate(booking.departureDate)}</span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}