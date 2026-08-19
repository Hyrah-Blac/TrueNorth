"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { FancyButton } from "@/components/shared/buttons/FancyButton";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { ConfirmDialog } from "@/components/admin/dialogs/ConfirmDialog";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { AirportFormDialog } from "@/components/admin/dialogs/AirportFormDialog";
import { deleteAirport } from "@/features/admin/actions/airport.actions";
import {
  RUNWAY_SURFACE_LABELS,
  AIRPORT_STATUS_LABELS,
} from "@/database/constants/airport";
import type { IAirport } from "@/types/airport";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-500",
  restricted: "bg-amber-100 text-amber-700",
};

interface AirportTableProps {
  initialAirports: IAirport[];
  total: number;
}

export function AirportTable({ initialAirports, total }: AirportTableProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState<IAirport | null>(null);
  const [deletingAirport, setDeletingAirport] = useState<IAirport | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleSaved() {
    router.refresh();
  }

  function handleDelete() {
    if (!deletingAirport) return;
    setDeleteError(null);

    startDeleteTransition(async () => {
      const result = await deleteAirport(deletingAirport._id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingAirport(null);
      router.refresh();
    });
  }

  return (
    <div>
      <ListToolbar count={total} noun="airport">
        <FancyButton
          onClick={() => {
            setEditingAirport(null);
            setFormOpen(true);
          }}
          icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          Add Airport
        </FancyButton>
      </ListToolbar>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        {initialAirports.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
              title="No airports yet"
              description="Add your first airport to build the knowledge base for the AI concierge."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAirport(null);
                    setFormOpen(true);
                  }}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add Airport
                </Button>
              }
            />
          </div>
        ) : (
          <div className="max-h-[32rem] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-widest2 text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Airport</th>
                  <th className="px-5 py-3.5 font-medium">ICAO / IATA</th>
                  <th className="px-5 py-3.5 font-medium">Location</th>
                  <th className="px-5 py-3.5 font-medium">Runway</th>
                  <th className="px-5 py-3.5 font-medium">Capabilities</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialAirports.map((airport, index) => (
                  <tr
                    key={airport._id}
                    className={`transition-colors duration-200 hover:bg-sky-50/60 ${
                      index % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy-900">{airport.name}</p>
                      {airport.isFeatured ? (
                        <span className="text-xs text-sky-600">Featured</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{airport.icao}</span>
                      {airport.iata ? (
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5">{airport.iata}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <p>{airport.city}</p>
                      <p className="text-xs text-slate-400">{airport.country}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {airport.runwayLengthM ? (
                        <p className="text-xs">{airport.runwayLengthM.toLocaleString()} m</p>
                      ) : null}
                      {airport.runwaySurface ? (
                        <p className="text-xs text-slate-400">{RUNWAY_SURFACE_LABELS[airport.runwaySurface]}</p>
                      ) : null}
                      {!airport.runwayLengthM && !airport.runwaySurface ? (
                        <span className="text-slate-300">—</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {airport.fuelAvailable ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">Fuel</span>
                        ) : null}
                        {airport.nightOperations ? (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">Night</span>
                        ) : null}
                        {airport.customsAvailable ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Customs</span>
                        ) : null}
                        {airport.medicalSupport ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Medical</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${statusStyles[airport.status]}`}
                      >
                        {AIRPORT_STATUS_LABELS[airport.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAirport(airport);
                            setFormOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
                          aria-label={`Edit ${airport.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAirport(airport)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${airport.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AirportFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        airport={editingAirport}
      />

      <ConfirmDialog
        open={Boolean(deletingAirport)}
        onClose={() => {
          setDeletingAirport(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Remove airport"
        description={`"${deletingAirport?.name}" will be permanently removed from the airport database.`}
        isPending={isDeleting}
        error={deleteError}
      />
    </div>
  );
}