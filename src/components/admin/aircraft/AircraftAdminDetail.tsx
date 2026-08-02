"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { AircraftFormDialog } from "@/components/admin/dialogs/AircraftFormDialog";
import { AIRCRAFT_CATEGORY_LABELS, AIRCRAFT_STATUS_LABELS } from "@/database/constants/aircraft";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import type { IAircraft } from "@/types/aircraft";

interface AircraftAdminDetailProps {
  aircraft: IAircraft;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <p className="w-48 shrink-0 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className="text-sm text-navy-900">{value}</p>
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-slate-300">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          {tag}
        </span>
      ))}
    </div>
  );
}

function RatingDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < value ? "bg-sky-500" : "bg-slate-200"}`}
        />
      ))}
      <span className="ml-1 text-sm text-navy-900">{value}/{max}</span>
    </span>
  );
}

export function AircraftAdminDetail({ aircraft }: AircraftAdminDetailProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
            icon={<Pencil className="h-4 w-4" />}
          >
            Edit Aircraft
          </Button>
        </div>

        {/* Core specs */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Core Specifications</p>
          <DetailRow label="Category" value={AIRCRAFT_CATEGORY_LABELS[aircraft.category]} />
          <DetailRow label="Status" value={AIRCRAFT_STATUS_LABELS[aircraft.status]} />
          <DetailRow label="Manufacturer" value={aircraft.manufacturer} />
          <DetailRow label="Model" value={aircraft.model} />
          <DetailRow label="Registration" value={aircraft.registration} />
          <DetailRow label="Passenger Capacity" value={aircraft.passengerCapacity} />
          <DetailRow label="Luggage Capacity" value={`${aircraft.luggageCapacityKg} kg`} />
          <DetailRow label="Range" value={`${aircraft.rangeNm.toLocaleString()} nm`} />
          <DetailRow label="Cruise Speed" value={`${aircraft.cruisingSpeedKts} kts`} />
          <DetailRow label="Base Airport" value={aircraft.baseAirportCode} />
          {aircraft.cabinHeightM ? <DetailRow label="Cabin Height" value={`${aircraft.cabinHeightM} m`} /> : null}
          {aircraft.cabinWidthM ? <DetailRow label="Cabin Width" value={`${aircraft.cabinWidthM} m`} /> : null}
          {aircraft.cabinLengthM ? <DetailRow label="Cabin Length" value={`${aircraft.cabinLengthM} m`} /> : null}
        </section>

        {/* AI concierge data */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">AI Concierge Data</p>
          {aircraft.minimumRunwayLength ? (
            <DetailRow label="Min. Runway" value={`${aircraft.minimumRunwayLength.toLocaleString()} m`} />
          ) : null}
          <DetailRow label="Preferred Surface" value={aircraft.preferredRunwaySurface} />
          {aircraft.luxuryLevel ? (
            <DetailRow label="Luxury Level" value={<RatingDots value={aircraft.luxuryLevel} />} />
          ) : null}
          {aircraft.executiveRating ? (
            <DetailRow label="Executive Rating" value={<RatingDots value={aircraft.executiveRating} />} />
          ) : null}
          <DetailRow label="Pet Friendly" value={aircraft.petFriendly === true ? "Yes" : aircraft.petFriendly === false ? "No" : undefined} />
          <DetailRow label="Wi-Fi Available" value={aircraft.wifiAvailable === true ? "Yes" : aircraft.wifiAvailable === false ? "No" : undefined} />
          <DetailRow label="Short Runway Capable" value={aircraft.shortRunwayCapable === true ? "Yes" : aircraft.shortRunwayCapable === false ? "No" : undefined} />
          <DetailRow label="Baggage Flexibility" value={aircraft.baggageFlexibility} />
          {aircraft.recommendedPassengerRange ? (
            <DetailRow
              label="Pax Range (AI)"
              value={`${aircraft.recommendedPassengerRange.min}–${aircraft.recommendedPassengerRange.max} passengers`}
            />
          ) : null}
          {aircraft.recommendedFlightRange ? (
            <DetailRow
              label="Flight Range (AI)"
              value={`${aircraft.recommendedFlightRange.minNm.toLocaleString()}–${aircraft.recommendedFlightRange.maxNm.toLocaleString()} nm`}
            />
          ) : null}
          {aircraft.operatingRegions.length > 0 ? (
            <div className="border-b border-slate-100 py-3 last:border-b-0">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">Operating Regions</p>
              <TagList tags={aircraft.operatingRegions} />
            </div>
          ) : null}
          {aircraft.recommendedMissionTypes.length > 0 ? (
            <div className="border-b border-slate-100 py-3 last:border-b-0">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">Recommended Mission Types (AI)</p>
              <TagList tags={aircraft.recommendedMissionTypes.map((m) => MISSION_TYPE_LABELS[m])} />
            </div>
          ) : null}
          {aircraft.aiStrengths.length > 0 ? (
            <div className="border-b border-slate-100 py-3 last:border-b-0">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">AI Strengths</p>
              <TagList tags={aircraft.aiStrengths} />
            </div>
          ) : null}
          {aircraft.aiLimitations.length > 0 ? (
            <div className="border-b border-slate-100 py-3 last:border-b-0">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">AI Limitations</p>
              <TagList tags={aircraft.aiLimitations} />
            </div>
          ) : null}
          {aircraft.aiNotes ? (
            <div className="py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">AI Notes</p>
              <p className="whitespace-pre-line text-sm text-slate-600">{aircraft.aiNotes}</p>
            </div>
          ) : null}
        </section>
      </div>

      <AircraftFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); router.refresh(); }}
        aircraft={aircraft}
      />
    </>
  );
}
