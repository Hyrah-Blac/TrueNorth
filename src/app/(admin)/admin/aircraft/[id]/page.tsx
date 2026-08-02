import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AircraftAdminDetail } from "@/components/admin/aircraft/AircraftAdminDetail";
import { getAircraftByIdOrSlug } from "@/features/aircraft/lib/getAircraft";

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

  return (
    <div>
      <PageHeader
        title={aircraft.name}
        description={`${aircraft.manufacturer} ${aircraft.model} · ${aircraft.registration}`}
        backHref="/admin/aircraft"
        backLabel="Back to fleet"
      />
      <AircraftAdminDetail aircraft={aircraft} />
    </div>
  );
}
