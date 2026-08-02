import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AirportTable } from "@/components/admin/tables/AirportTable";
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

  return (
    <div>
      <PageHeader
        title="Airport Database"
        description="Manage airports and airstrips used by the AI concierge for routing recommendations."
      />
      <AirportTable initialAirports={result.airports} total={result.total} />
    </div>
  );
}
