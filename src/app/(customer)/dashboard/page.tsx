import Link from "next/link";
import { AirplaneTakeoff, FileText, Wallet, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { StatCard } from "@/components/dashboard/cards/StatCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BookingCard } from "@/components/booking/BookingCard/BookingCard";
import { QuoteCard } from "@/components/quote/QuoteCard";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { Button } from "@/components/shared/buttons/Button";
import { getMyBookings } from "@/features/booking/lib/getBookings";
import { getMyQuotes } from "@/features/quote/lib/getQuotes";
import { formatCurrency } from "@/utils/currency";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";

export default async function DashboardOverviewPage() {
  const [bookings, quotes] = await Promise.all([getMyBookings(), getMyQuotes()]);

  const activeBookings = bookings.filter(
    (booking) => booking.status !== BOOKING_STATUSES.COMPLETED && booking.status !== BOOKING_STATUSES.CANCELLED
  );
  const pendingQuotes = quotes.filter((quote) => quote.status === QUOTE_STATUSES.PENDING || quote.status === QUOTE_STATUSES.REVIEWING);
  const bookingsWithBalance = bookings.filter((booking) => booking.balanceAmount > 0);
  const outstandingBalance = bookingsWithBalance.reduce((sum, booking) => sum + booking.balanceAmount, 0);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Overview" title="Welcome back" description="Here's where things stand across your account." />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Active bookings"
          value={String(activeBookings.length)}
          icon={AirplaneTakeoff}
          hint={activeBookings.length === 0 ? "No trips in progress" : "In progress or upcoming"}
        />
        <StatCard
          label="Pending quotes"
          value={String(pendingQuotes.length)}
          icon={FileText}
          hint={pendingQuotes.length === 0 ? "Nothing awaiting review" : "Awaiting our review"}
        />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(outstandingBalance)}
          icon={Wallet}
          hint={
            bookingsWithBalance.length === 0
              ? "All bookings fully paid"
              : `Across ${bookingsWithBalance.length} booking${bookingsWithBalance.length === 1 ? "" : "s"}`
          }
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-light text-white">Recent bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-sky-400 transition-colors hover:text-sky-300"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {bookings.length === 0 ? (
            <div className="lg:col-span-3">
              <EmptyState
                icon={<AirplaneTakeoff className="h-5 w-5" aria-hidden="true" />}
                title="No bookings yet"
                description="Once a charter request is approved, it will show up here."
                action={
                  <Button href="/request-charter" variant="outline">
                    Request a Charter
                  </Button>
                }
              />
            </div>
          ) : (
            bookings.slice(0, 3).map((booking) => <BookingCard key={booking._id} booking={booking} />)
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-light text-white">Recent quotes</h2>
          <Link
            href="/dashboard/quotes"
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-sky-400 transition-colors hover:text-sky-300"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {quotes.length === 0 ? (
            <div className="lg:col-span-3">
              <EmptyState
                icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                title="No quotes yet"
                description="Submit a charter request to get started."
              />
            </div>
          ) : (
            quotes.slice(0, 3).map((quote) => <QuoteCard key={quote._id} quote={quote} />)
          )}
        </div>
      </div>
    </div>
  );
}