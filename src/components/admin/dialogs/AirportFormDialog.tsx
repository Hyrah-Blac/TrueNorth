"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Textarea } from "@/components/forms/Textarea";
import { Select } from "@/components/forms/Select";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch";
import { Button } from "@/components/shared/buttons/Button";
import {
  createAirportSchema,
  type CreateAirportInput,
} from "@/features/airport/schemas/airport.schema";
import { createAirport, updateAirport } from "@/features/admin/actions/airport.actions";
import {
  RUNWAY_SURFACE_VALUES,
  RUNWAY_SURFACE_LABELS,
  AIRPORT_STATUS_VALUES,
  AIRPORT_STATUS_LABELS,
} from "@/database/constants/airport";
import type { IAirport } from "@/types/airport";

interface AirportFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  airport?: IAirport | null;
}

function toFormDefaults(airport?: IAirport | null): Partial<CreateAirportInput> {
  if (!airport) {
    return {
      status: "active",
      isFeatured: false,
      fuelAvailable: false,
      nightOperations: false,
      customsAvailable: false,
      medicalSupport: false,
    };
  }

  return {
    icao: airport.icao,
    iata: airport.iata ?? "",
    name: airport.name,
    country: airport.country,
    city: airport.city,
    latitude: airport.latitude,
    longitude: airport.longitude,
    runwayLengthM: airport.runwayLengthM,
    runwaySurface: airport.runwaySurface,
    elevationFt: airport.elevationFt,
    fuelAvailable: airport.fuelAvailable,
    nightOperations: airport.nightOperations,
    customsAvailable: airport.customsAvailable,
    medicalSupport: airport.medicalSupport,
    notes: airport.notes,
    status: airport.status,
    isFeatured: airport.isFeatured,
  };
}

export function AirportFormDialog({ open, onClose, onSaved, airport }: AirportFormDialogProps) {
  const isEditing = Boolean(airport);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAirportInput>({
    resolver: zodResolver(createAirportSchema),
    defaultValues: toFormDefaults(airport),
  });

  useEffect(() => {
    if (open) reset(toFormDefaults(airport));
  }, [open, airport, reset]);

  async function onSubmit(data: CreateAirportInput) {
    const result = isEditing && airport
      ? await updateAirport(airport._id, data)
      : await createAirport(data);

    if (result.success) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Airport" : "Add Airport"} maxWidth="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Codes + name */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="ICAO Code" htmlFor="icao" required error={errors.icao?.message} hint="4 letters, e.g. HWKF">
            <TextInput id="icao" hasError={Boolean(errors.icao)} {...register("icao")} />
          </FormField>
          <FormField label="IATA Code" htmlFor="iata" error={errors.iata?.message} hint="3 letters, optional">
            <TextInput id="iata" {...register("iata")} />
          </FormField>
          <FormField label="Airport Name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" hasError={Boolean(errors.name)} {...register("name")} />
          </FormField>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="City" htmlFor="city" required error={errors.city?.message}>
            <TextInput id="city" hasError={Boolean(errors.city)} {...register("city")} />
          </FormField>
          <FormField label="Country" htmlFor="country" required error={errors.country?.message}>
            <TextInput id="country" hasError={Boolean(errors.country)} {...register("country")} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Latitude" htmlFor="latitude" required error={errors.latitude?.message} hint="e.g. -1.3219">
            <TextInput id="latitude" type="number" step="any" hasError={Boolean(errors.latitude)} {...register("latitude", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Longitude" htmlFor="longitude" required error={errors.longitude?.message} hint="e.g. 36.9251">
            <TextInput id="longitude" type="number" step="any" hasError={Boolean(errors.longitude)} {...register("longitude", { valueAsNumber: true })} />
          </FormField>
        </div>

        {/* Runway */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Runway Length (m)" htmlFor="runwayLengthM" error={errors.runwayLengthM?.message}>
            <TextInput id="runwayLengthM" type="number" min={0} {...register("runwayLengthM", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Runway Surface" htmlFor="runwaySurface" error={errors.runwaySurface?.message}>
            <Select id="runwaySurface" defaultValue="" {...register("runwaySurface")}>
              <option value="">Not specified</option>
              {RUNWAY_SURFACE_VALUES.map((v) => (
                <option key={v} value={v}>{RUNWAY_SURFACE_LABELS[v]}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Elevation (ft)" htmlFor="elevationFt" error={errors.elevationFt?.message}>
            <TextInput id="elevationFt" type="number" step="any" {...register("elevationFt", { valueAsNumber: true })} />
          </FormField>
        </div>

        {/* Capabilities */}
        <div>
          <p className="mb-3 text-sm font-medium text-navy-900">Capabilities</p>
          <div className="flex flex-wrap gap-5">
            <ToggleSwitch label="Fuel Available" {...register("fuelAvailable")} />
            <ToggleSwitch label="Night Operations" {...register("nightOperations")} />
            <ToggleSwitch label="Customs Available" {...register("customsAvailable")} />
            <ToggleSwitch label="Medical Support" {...register("medicalSupport")} />
          </div>
        </div>

        {/* Status + featured */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
            <Select id="status" {...register("status")}>
              {AIRPORT_STATUS_VALUES.map((v) => (
                <option key={v} value={v}>{AIRPORT_STATUS_LABELS[v]}</option>
              ))}
            </Select>
          </FormField>
          <div className="flex items-end pb-1">
            <ToggleSwitch label="Featured airport" {...register("isFeatured")} />
          </div>
        </div>

        {/* Notes */}
        <FormField label="Notes" htmlFor="notes" hint="Operational notes, access requirements, restrictions" error={errors.notes?.message}>
          <Textarea id="notes" rows={3} {...register("notes")} />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Add Airport"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}