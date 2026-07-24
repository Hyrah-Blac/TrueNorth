import type { Metadata } from "next";
import { AircraftTable } from "@/components/admin/tables/AircraftTable";
import { getAllAircraftForAdmin } from "@/features/admin/actions/aircraft.actions";

export const metadata: Metadata = { title: "Manage Aircraft" };

export default async function AdminAircraftPage() {
  const aircraft = await getAllAircraftForAdmin();

  return <AircraftTable initialAircraft={aircraft} />;
}
