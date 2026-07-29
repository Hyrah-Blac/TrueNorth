import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AircraftTable } from "@/components/admin/tables/AircraftTable";
import { getAllAircraftForAdmin } from "@/features/admin/actions/aircraft.actions";

export const metadata: Metadata = { title: "Manage Aircraft" };

export default async function AdminAircraftPage() {
  const aircraft = await getAllAircraftForAdmin();

  return (
    <div>
      <PageHeader
        variant="light"
        eyebrow="Admin"
        title="Fleet Management"
        description="Add, edit, and retire the aircraft listed on the public site."
      />
      <AircraftTable initialAircraft={aircraft} />
    </div>
  );
}