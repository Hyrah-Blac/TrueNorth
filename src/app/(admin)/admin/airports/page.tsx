import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AirportTable } from "@/components/admin/tables/AirportTable";
import { Pagination } from "@/components/shared/Pagination";
import { getAirportsForAdmin } from "@/features/admin/actions/airport.actions";

export const metadata: Metadata = { title: "Manage Airports" };

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string; country?: string }>;
}

export default async function AdminAirportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await getAirportsForAdmin({
    page,
    limit: 20,
    search: params.search,
    status: params.status,
    country: params.country,
  });

  function buildHref(nextPage: number) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status) next.set("status", params.status);
    if (params.country) next.set("country", params.country);
    if (nextPage > 1) next.set("page", String(nextPage));

    const query = next.toString();
    return query ? `/admin/airports?${query}` : "/admin/airports";
  }

  return (
    <div>
      <PageHeader
        variant="light"
        showTitle={false}
        title="Airport Database"
        description="Manage airports and airstrips used by the AI concierge for routing recommendations."
      />
      <AirportTable initialAirports={result.airports} total={result.total} />
      {/* Server returns 20 airports per page (result.airports); result.total
          is the count across the full filtered set. Without this, the table
          only ever rendered page 1 with no way to reach the rest — out of
          461 airports in the database, only the first 20 were ever visible
          or editable from this screen. */}
      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </div>
  );
}