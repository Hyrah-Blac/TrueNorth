import type { Metadata } from "next";
import { AirplaneTakeoff } from "@phosphor-icons/react/dist/ssr";
import { BookingCard } from "@/components/booking/BookingCard/BookingCard";
import { BookingsTable } from "@/components/booking/BookingCard/BookingsTable";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getMyBookings } from "@/features/booking/lib/getBookings";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { getBookingIdsWithTickets } from "@/features/ticket/lib/getTicketForBooking";

export const metadata: Metadata = { title: "My Bookings" };

// No status filter here — matches the Quotes page: a customer's own
// booking history is short enough that a bank of filter pills is more
// chrome than the list needs. Status is still visible per-booking via
// the badge on each row/card.
export default async function BookingsPage() {
  const bookings = await getMyBookings();
  const [ticketedBookingIds, airportNames] = await Promise.all([
    getBookingIdsWithTickets(bookings.map((b) => b._id)),
    getAirportNamesByCodes(bookings.flatMap((b) => [b.departureAirportCode, b.destinationAirportCode])),
  ]);

  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-5xl flex-col justify-center py-8 sm:py-12 lg:py-16">
      <div>
        <PageHeader
          variant="light"
          divider={false}
          title="Your Bookings"
          description="Every confirmed charter, from first departure to final invoice."
        />

        {bookings.length === 0 ? (
          <EmptyState
            icon={<AirplaneTakeoff className="h-5 w-5 text-champagne-500" aria-hidden="true" />}
            title="No bookings found"
            description="Bookings appear here once a charter request has been approved."
          />
        ) : (
          <>
            <BookingsTable bookings={bookings} airportNames={airportNames} />
            <div className="space-y-4 md:hidden">
              {bookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} hasTicket={ticketedBookingIds.has(booking._id)} airportNames={airportNames} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}