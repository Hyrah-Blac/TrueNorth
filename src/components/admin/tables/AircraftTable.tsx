"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, PlaneTakeoff, Loader2, X } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { AircraftFormDialog } from "@/components/admin/dialogs/AircraftFormDialog";
import { ConfirmDialog } from "@/components/admin/dialogs/ConfirmDialog";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { deleteAircraft, updateAircraft } from "@/features/admin/actions/aircraft.actions";
import { AIRCRAFT_CATEGORY_LABELS, AIRCRAFT_STATUS_LABELS, type AircraftStatus } from "@/database/constants/aircraft";
import type { IAircraft } from "@/types/aircraft";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  maintenance: "bg-gold-200 text-gold-600",
  inactive: "bg-slate-100 text-slate-500",
};

export function AircraftTable({ initialAircraft }: { initialAircraft: IAircraft[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<IAircraft | null>(null);
  const [deletingAircraft, setDeletingAircraft] = useState<IAircraft | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isBulkWorking, startBulkTransition] = useTransition();

  const selectedCount = selectedIds.size;
  const allSelected = initialAircraft.length > 0 && selectedCount === initialAircraft.length;

  const selectedAircraft = useMemo(
    () => initialAircraft.filter((aircraft) => selectedIds.has(aircraft._id)),
    [initialAircraft, selectedIds]
  );

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(initialAircraft.map((aircraft) => aircraft._id)));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleSaved() {
    router.refresh();
  }

  function handleDelete() {
    if (!deletingAircraft) return;
    setDeleteError(null);

    startDeleteTransition(async () => {
      const result = await deleteAircraft(deletingAircraft._id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingAircraft(null);
      router.refresh();
    });
  }

  function handleBulkDelete() {
    setBulkError(null);
    startBulkTransition(async () => {
      const results = await Promise.all(selectedAircraft.map((aircraft) => deleteAircraft(aircraft._id)));
      const failed = results.filter((result) => !result.success);
      if (failed.length > 0) {
        setBulkError(`${failed.length} of ${results.length} aircraft could not be removed. Please try again.`);
        return;
      }
      setBulkDeleteOpen(false);
      clearSelection();
      router.refresh();
    });
  }

  function handleBulkStatusChange(status: AircraftStatus) {
    setBulkError(null);
    startBulkTransition(async () => {
      const results = await Promise.all(
        selectedAircraft.map((aircraft) => updateAircraft(aircraft._id, { status }))
      );
      const failed = results.filter((result) => !result.success);
      if (failed.length > 0) {
        setBulkError(`${failed.length} of ${results.length} aircraft could not be updated. Please try again.`);
        return;
      }
      clearSelection();
      router.refresh();
    });
  }

  return (
    <div>
      <ListToolbar count={initialAircraft.length} noun="aircraft">
        <Button
          variant="primary"
          onClick={() => {
            setEditingAircraft(null);
            setFormOpen(true);
          }}
          icon={<Plus className="h-4 w-4" />}
        >
          Add Aircraft
        </Button>
      </ListToolbar>

      {selectedCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-sky-200 bg-sky-50/70 px-4 py-3">
          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-navy-900 transition-colors hover:bg-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {selectedCount} selected
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {isBulkWorking ? <Loader2 className="h-4 w-4 animate-spin text-sky-600" aria-hidden="true" /> : null}
            <button
              type="button"
              disabled={isBulkWorking}
              onClick={() => handleBulkStatusChange("active")}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-navy-900 transition-colors hover:border-sky-400 disabled:opacity-50"
            >
              Mark active
            </button>
            <button
              type="button"
              disabled={isBulkWorking}
              onClick={() => handleBulkStatusChange("inactive")}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-navy-900 transition-colors hover:border-sky-400 disabled:opacity-50"
            >
              Mark inactive
            </button>
            <button
              type="button"
              disabled={isBulkWorking}
              onClick={() => setBulkDeleteOpen(true)}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}

      {bulkError ? <p className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{bulkError}</p> : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-soft">
        {initialAircraft.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<PlaneTakeoff className="h-5 w-5" aria-hidden="true" />}
              title="No aircraft yet"
              description="Add your first aircraft to start building the public fleet listing."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAircraft(null);
                    setFormOpen(true);
                  }}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add Aircraft
                </Button>
              }
            />
          </div>
        ) : (
          <div className="max-h-[32rem] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-widest2 text-slate-500">
                <tr>
                  <th className="w-11 px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all aircraft"
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                    />
                  </th>
                  <th className="px-5 py-3.5 font-medium">Aircraft</th>
                  <th className="px-5 py-3.5 font-medium">Category</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Featured</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialAircraft.map((aircraft, index) => {
                  const isSelected = selectedIds.has(aircraft._id);
                  return (
                    <tr
                      key={aircraft._id}
                      className={`transition-colors duration-200 hover:bg-sky-50/60 ${
                        isSelected ? "bg-sky-50" : index % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(aircraft._id)}
                          aria-label={`Select ${aircraft.name}`}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-navy-900">{aircraft.name}</p>
                        <p className="text-xs text-slate-500">{aircraft.registration}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{AIRCRAFT_CATEGORY_LABELS[aircraft.category]}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${statusStyles[aircraft.status]}`}
                        >
                          {AIRCRAFT_STATUS_LABELS[aircraft.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{aircraft.isFeatured ? "Yes" : "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAircraft(aircraft);
                              setFormOpen(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
                            aria-label={`Edit ${aircraft.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAircraft(aircraft)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${aircraft.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AircraftFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        aircraft={editingAircraft}
      />

      <ConfirmDialog
        open={Boolean(deletingAircraft)}
        onClose={() => {
          setDeletingAircraft(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Remove aircraft"
        description={`"${deletingAircraft?.name}" will be removed from the public fleet listing. This can be reversed by an administrator if needed.`}
        isPending={isDeleting}
        error={deleteError}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => {
          setBulkDeleteOpen(false);
          setBulkError(null);
        }}
        onConfirm={handleBulkDelete}
        title="Remove selected aircraft"
        description={`${selectedCount} aircraft will be removed from the public fleet listing. This can be reversed by an administrator if needed.`}
        isPending={isBulkWorking}
        error={bulkError}
      />
    </div>
  );
}
