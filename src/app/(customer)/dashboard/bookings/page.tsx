import type { Metadata } from "next";
import { AirplaneTakeoff } from "@phosphor-icons/react/dist/ssr";
import { BookingCard } from "@/components/booking/BookingCard/BookingCard";
import { BookingsTable } from "@/components/booking/BookingCard/BookingsTable";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { Button } from "@/components/shared/buttons/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusFilterTabs } from "@/components/dashboard/StatusFilterTabs";
import { getMyBookings } from "@/features/booking/lib/getBookings";
import { BOOKING_STATUS_VALUES, BOOKING_STATUS_LABELS, type BookingStatus } from "@/database/constants/booking-status";

export const metadata: Metadata = { title: "My Bookings" };

interface BookingsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const params = await searchParams;
  const status = BOOKING_STATUS_VALUES.includes(params.status as BookingStatus)
    ? (params.status as BookingStatus)
    : undefined;

  const bookings = await getMyBookings(status);

  const filterOptions = [
    { label: "All", href: "/dashboard/bookings", active: !status },
    ...BOOKING_STATUS_VALUES.map((value) => ({
      label: BOOKING_STATUS_LABELS[value],
      href: `/dashboard/bookings?status=${value}`,
      active: status === value,
    })),
  ];

  return (
    <div>
   <PageHeader
  variant="light"
  title="Your Bookings"
  description="Every confirmed charter, from first departure to final invoice."
/>
      <StatusFilterTabs options={filterOptions} />

      <div className="mt-7">
        {bookings.length === 0 ? (
          <EmptyState
            icon={<AirplaneTakeoff className="h-5 w-5" aria-hidden="true" />}
            title="No bookings found"
            description="Bookings appear here once a charter request has been approved."
            action={
              <Button href="/request-charter" variant="outline">
                Request a Charter
              </Button>
            }
          />
        ) : (
          <>
            <BookingsTable bookings={bookings} />
            <div className="space-y-4 md:hidden">
              {bookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}