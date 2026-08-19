import type { Metadata } from "next";
import { PlaneTakeoff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AdminBookingRow } from "@/components/admin/tables/AdminBookingRow";
import { BookingSearchBox } from "@/components/admin/tables/BookingSearchBox";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { FilterTabs } from "@/components/admin/layout/FilterTabs";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { Pagination } from "@/components/shared/Pagination";
import { getBookingsForAdmin } from "@/features/admin/lib/getBookingsForAdmin";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { buildPaginationMeta } from "@/utils/pagination";
import { BOOKING_STATUS_VALUES, BOOKING_STATUS_LABELS, type BookingStatus } from "@/database/constants/booking-status";
import {
  BOOKING_PAYMENT_STATUS_VALUES,
  BOOKING_PAYMENT_STATUS_LABELS,
  type BookingPaymentStatus,
} from "@/utils/currency";

export const metadata: Metadata = { title: "Manage Bookings" };

interface AdminBookingsPageProps {
  searchParams: Promise<{ status?: string; payment?: string; search?: string; page?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;

  const status = BOOKING_STATUS_VALUES.includes(params.status as BookingStatus)
    ? (params.status as BookingStatus)
    : undefined;
  const paymentStatus = BOOKING_PAYMENT_STATUS_VALUES.includes(params.payment as BookingPaymentStatus)
    ? (params.payment as BookingPaymentStatus)
    : undefined;
  const search = params.search?.trim() || undefined;
  const page = params.page ? Math.max(Number(params.page), 1) : 1;

  const { items: bookings, total, limit } = await getBookingsForAdmin({
    status,
    paymentStatus,
    search,
    page,
  });
  const airportNames = await getAirportNamesByCodes(
    bookings.flatMap((b) => [b.departureAirportCode, b.destinationAirportCode])
  );
  const meta = buildPaginationMeta(total, page, limit);

  function buildHref(overrides: { status?: string; payment?: string; page?: number }) {
    const next = new URLSearchParams();
    const nextStatus = "status" in overrides ? overrides.status : status;
    const nextPayment = "payment" in overrides ? overrides.payment : paymentStatus;
    const nextPage = overrides.page;

    if (nextStatus) next.set("status", nextStatus);
    if (nextPayment) next.set("payment", nextPayment);
    if (search) next.set("search", search);
    if (nextPage && nextPage > 1) next.set("page", String(nextPage));

    const query = next.toString();
    return query ? `/admin/bookings?${query}` : "/admin/bookings";
  }

  const activeFilterCount = [status, paymentStatus, search].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        variant="light"
        showTitle={false}
        title="Bookings"
        description="Manage confirmed charters and track each one through to completion."
      />

      <div className="space-y-3">
        <FilterTabs
          options={[
            { label: "All", href: buildHref({ status: undefined }), active: !status },
            ...BOOKING_STATUS_VALUES.map((value) => ({
              label: BOOKING_STATUS_LABELS[value],
              href: buildHref({ status: value }),
              active: status === value,
            })),
          ]}
        />
        <FilterTabs
          options={[
            { label: "All Payments", href: buildHref({ payment: undefined }), active: !paymentStatus },
            ...BOOKING_PAYMENT_STATUS_VALUES.map((value) => ({
              label: BOOKING_PAYMENT_STATUS_LABELS[value],
              href: buildHref({ payment: value }),
              active: paymentStatus === value,
            })),
          ]}
        />
      </div>

      <div className="mt-6">
        <ListToolbar count={total} noun="booking">
          <BookingSearchBox />
        </ListToolbar>
      </div>

      {bookings.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon={<PlaneTakeoff className="h-5 w-5" aria-hidden="true" />}
            title={activeFilterCount > 0 ? "No bookings match your current filters" : "No bookings found"}
            description={
              activeFilterCount > 0
                ? search
                  ? `Nothing matched "${search}" with these filters. Try clearing a filter or searching for something else.`
                  : paymentStatus
                    ? `No ${BOOKING_PAYMENT_STATUS_LABELS[paymentStatus].toLowerCase()} bookings found.`
                    : "Try clearing a filter to see more results."
                : "Bookings will appear here once a quote is approved and converted."
            }
          />
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {bookings.map((booking) => (
            <AdminBookingRow key={booking._id} booking={booking} airportNames={airportNames} />
          ))}
        </div>
      )}

      <Pagination page={meta.page} totalPages={meta.totalPages} buildHref={(p) => buildHref({ page: p })} />
    </div>
  );
}
