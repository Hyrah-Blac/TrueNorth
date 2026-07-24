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
import { ImageUploader } from "@/components/admin/forms/ImageUploader";
import { Button } from "@/components/shared/buttons/Button";
import {
  createAircraftSchema,
  type CreateAircraftInput,
} from "@/features/aircraft/schemas/aircraft.schema";
import { createAircraft, updateAircraft } from "@/features/admin/actions/aircraft.actions";
import { AIRCRAFT_CATEGORY_VALUES, AIRCRAFT_CATEGORY_LABELS, AIRCRAFT_STATUS_VALUES, AIRCRAFT_STATUS_LABELS } from "@/database/constants/aircraft";
import { MISSION_TYPE_VALUES, MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { airports } from "@/content/airports";
import type { IAircraft } from "@/types/aircraft";

interface AircraftFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  aircraft?: IAircraft | null;
}

function toFormDefaults(aircraft?: IAircraft | null): Partial<CreateAircraftInput> {
  if (!aircraft) {
    return {
      status: "active",
      isFeatured: false,
      amenities: [],
      recommendedMissions: [],
      exteriorImages: [],
      interiorImages: [],
      cabinImages: [],
    };
  }

  return {
    name: aircraft.name,
    category: aircraft.category,
    manufacturer: aircraft.manufacturer,
    model: aircraft.model,
    registration: aircraft.registration,
    tagline: aircraft.tagline,
    description: aircraft.description,
    passengerCapacity: aircraft.passengerCapacity,
    luggageCapacityKg: aircraft.luggageCapacityKg,
    rangeNm: aircraft.rangeNm,
    cruisingSpeedKts: aircraft.cruisingSpeedKts,
    cabinHeightM: aircraft.cabinHeightM,
    cabinWidthM: aircraft.cabinWidthM,
    cabinLengthM: aircraft.cabinLengthM,
    amenities: aircraft.amenities,
    recommendedMissions: aircraft.recommendedMissions,
    baseAirportCode: aircraft.baseAirportCode,
    status: aircraft.status,
    isFeatured: aircraft.isFeatured,
    heroImage: aircraft.heroImage,
    exteriorImages: aircraft.exteriorImages,
    interiorImages: aircraft.interiorImages,
    cabinImages: aircraft.cabinImages,
  };
}

export function AircraftFormDialog({ open, onClose, onSaved, aircraft }: AircraftFormDialogProps) {
  const isEditing = Boolean(aircraft);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAircraftInput>({
    resolver: zodResolver(createAircraftSchema),
    defaultValues: toFormDefaults(aircraft),
  });

  useEffect(() => {
    if (open) reset(toFormDefaults(aircraft));
  }, [open, aircraft, reset]);

  const selectedMissions = watch("recommendedMissions") ?? [];
  const heroImage = watch("heroImage");
  const exteriorImages = watch("exteriorImages") ?? [];
  const interiorImages = watch("interiorImages") ?? [];
  const cabinImages = watch("cabinImages") ?? [];

  function toggleMission(mission: string) {
    const current = selectedMissions;
    const next = current.includes(mission as never)
      ? current.filter((item) => item !== mission)
      : [...current, mission as never];
    setValue("recommendedMissions", next);
  }

  async function onSubmit(data: CreateAircraftInput) {
    const result = isEditing && aircraft ? await updateAircraft(aircraft._id, data) : await createAircraft(data);

    if (result.success) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Aircraft" : "Add Aircraft"} maxWidth="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" hasError={Boolean(errors.name)} {...register("name")} />
          </FormField>
          <FormField label="Category" htmlFor="category" required error={errors.category?.message}>
            <Select id="category" defaultValue="" {...register("category")}>
              <option value="" disabled>
                Select category
              </option>
              {AIRCRAFT_CATEGORY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {AIRCRAFT_CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Manufacturer" htmlFor="manufacturer" required error={errors.manufacturer?.message}>
            <TextInput id="manufacturer" hasError={Boolean(errors.manufacturer)} {...register("manufacturer")} />
          </FormField>
          <FormField label="Model" htmlFor="model" required error={errors.model?.message}>
            <TextInput id="model" hasError={Boolean(errors.model)} {...register("model")} />
          </FormField>
          <FormField label="Registration" htmlFor="registration" required error={errors.registration?.message}>
            <TextInput id="registration" hasError={Boolean(errors.registration)} {...register("registration")} />
          </FormField>
        </div>

        <FormField label="Tagline" htmlFor="tagline" hint="Optional, shown under the name" error={errors.tagline?.message}>
          <TextInput id="tagline" {...register("tagline")} />
        </FormField>

        <FormField label="Description" htmlFor="description" required error={errors.description?.message}>
          <Textarea id="description" rows={4} hasError={Boolean(errors.description)} {...register("description")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField label="Passengers" htmlFor="passengerCapacity" required error={errors.passengerCapacity?.message}>
            <TextInput id="passengerCapacity" type="number" min={1} {...register("passengerCapacity", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Luggage (kg)" htmlFor="luggageCapacityKg" required error={errors.luggageCapacityKg?.message}>
            <TextInput id="luggageCapacityKg" type="number" min={0} {...register("luggageCapacityKg", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Range (nm)" htmlFor="rangeNm" required error={errors.rangeNm?.message}>
            <TextInput id="rangeNm" type="number" min={0} {...register("rangeNm", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Cruise (kts)" htmlFor="cruisingSpeedKts" required error={errors.cruisingSpeedKts?.message}>
            <TextInput id="cruisingSpeedKts" type="number" min={0} {...register("cruisingSpeedKts", { valueAsNumber: true })} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Base airport" htmlFor="baseAirportCode" required error={errors.baseAirportCode?.message}>
            <Select id="baseAirportCode" defaultValue="" {...register("baseAirportCode")}>
              <option value="" disabled>
                Select airport
              </option>
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.name} ({airport.code})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
            <Select id="status" {...register("status")}>
              {AIRCRAFT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {AIRCRAFT_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          label="Amenities"
          htmlFor="amenities"
          hint="Comma-separated, e.g. Wi-Fi, Leather seats, Refreshments"
        >
          <TextInput
            id="amenities"
            defaultValue={toFormDefaults(aircraft).amenities?.join(", ")}
            onChange={(event) =>
              setValue(
                "amenities",
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-medium text-navy-900">Recommended missions</p>
          <div className="flex flex-wrap gap-2">
            {MISSION_TYPE_VALUES.map((mission) => (
              <button
                key={mission}
                type="button"
                onClick={() => toggleMission(mission)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
                  selectedMissions.includes(mission as never)
                    ? "border-sky-500 bg-sky-100 text-sky-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {MISSION_TYPE_LABELS[mission]}
              </button>
            ))}
          </div>
        </div>

        <ToggleSwitch label="Featured on homepage" {...register("isFeatured")} />

        <div className="space-y-5 border-t border-slate-100 pt-5">
          <ImageUploader
            label="Hero image"
            images={heroImage ? [heroImage] : []}
            onChange={(images) => setValue("heroImage", images[0])}
            multiple={false}
            maxImages={1}
          />
          <ImageUploader
            label="Exterior gallery"
            images={exteriorImages}
            onChange={(images) => setValue("exteriorImages", images)}
          />
          <ImageUploader
            label="Interior gallery"
            images={interiorImages}
            onChange={(images) => setValue("interiorImages", images)}
          />
          <ImageUploader
            label="Cabin gallery"
            images={cabinImages}
            onChange={(images) => setValue("cabinImages", images)}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Add Aircraft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
