import type { Metadata } from "next";
import { PlaneTakeoff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AdminBookingRow } from "@/components/admin/tables/AdminBookingRow";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { FilterTabs } from "@/components/admin/layout/FilterTabs";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { getBookingsForAdmin } from "@/features/admin/lib/getBookingsForAdmin";
import { BOOKING_STATUS_VALUES, BOOKING_STATUS_LABELS, type BookingStatus } from "@/database/constants/booking-status";

export const metadata: Metadata = { title: "Manage Bookings" };

interface AdminBookingsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const status = BOOKING_STATUS_VALUES.includes(params.status as BookingStatus)
    ? (params.status as BookingStatus)
    : undefined;

  const bookings = await getBookingsForAdmin(status);

  return (
    <div>
     <PageHeader
  title="Bookings"
  description="Manage confirmed charters and track each one through to completion."
/>

      <FilterTabs
        options={[
          { label: "All", href: "/admin/bookings", active: !status },
          ...BOOKING_STATUS_VALUES.map((value) => ({
            label: BOOKING_STATUS_LABELS[value],
            href: `/admin/bookings?status=${value}`,
            active: status === value,
          })),
        ]}
      />

      <div className="mt-6">
        <ListToolbar count={bookings.length} noun="booking" />
      </div>

      <div className="mt-4 space-y-4">
        {bookings.length === 0 ? (
          <EmptyState
            icon={<PlaneTakeoff className="h-5 w-5" aria-hidden="true" />}
            title="No bookings found"
            description="Bookings will appear here once a quote is approved and converted."
          />
        ) : (
          bookings.map((booking) => <AdminBookingRow key={booking._id} booking={booking} />)
        )}
      </div>
    </div>
  );
}