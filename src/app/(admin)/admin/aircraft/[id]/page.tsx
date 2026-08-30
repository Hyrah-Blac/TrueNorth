import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AircraftAdminDetail } from "@/components/admin/aircraft/AircraftAdminDetail";
import { getAircraftByIdOrSlug } from "@/features/aircraft/lib/getAircraft";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const aircraft = await getAircraftByIdOrSlug(id);
  return { title: aircraft ? `${aircraft.name} — Detail` : "Aircraft Not Found" };
}

export default async function AdminAircraftDetailPage({ params }: Props) {
  const { id } = await params;
  const aircraft = await getAircraftByIdOrSlug(id);

  if (!aircraft) notFound();

  // Resolves the base airport's name/city for display so this reads the
  // same as every other airport reference on the site — a bare ICAO
  // code otherwise means nothing to anyone who doesn't have it
  // memorized. Falls back to the raw code if the airport isn't in the
  // database, same convention used everywhere else.
  const baseAirportNames = await getAirportNamesByCodes([aircraft.baseAirportCode]);
  const baseAirportInfo = baseAirportNames[aircraft.baseAirportCode.toUpperCase()];
  const baseAirportLabel = baseAirportInfo
    ? `${baseAirportInfo.name} (${aircraft.baseAirportCode})`
    : aircraft.baseAirportCode;

  return (
    <div>
      <PageHeader
        variant="light"
        showTitle={false}
        title={aircraft.name}
        description={`${aircraft.manufacturer} ${aircraft.model} · ${aircraft.registration}`}
        backHref="/admin/aircraft"
        backLabel="Back to fleet"
      />
      <AircraftAdminDetail aircraft={aircraft} baseAirportLabel={baseAirportLabel} />
    </div>
  );
}