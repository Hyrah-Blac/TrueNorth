import Image from "next/image";
import { Users, MapPinned, Gauge, PawPrint, Wifi } from "lucide-react";
import { AIRCRAFT_CATEGORY_LABELS } from "@/database/constants/aircraft";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { CompareButton } from "@/components/aircraft/compare/CompareButton";
import { useConcierge } from "../../context/ConciergeContext";
import { buildRequestQuoteHref } from "../../lib/tripDraft";
import { CardActionLink } from "./CardActionLink";
import type { AircraftSummary } from "../../types";

function isMissionType(value: string): value is keyof typeof MISSION_TYPE_LABELS {
  return value in MISSION_TYPE_LABELS;
}

export function AircraftResultCard({ aircraft }: { aircraft: AircraftSummary }) {
  const { tripDraft } = useConcierge();
  const categoryLabel =
    aircraft.category in AIRCRAFT_CATEGORY_LABELS
      ? AIRCRAFT_CATEGORY_LABELS[aircraft.category as keyof typeof AIRCRAFT_CATEGORY_LABELS]
      : aircraft.category;

  const missions = aircraft.recommendedMissionTypes.slice(0, 2);
  const explanation = aircraft.aiNotes || aircraft.aiStrengths[0] || aircraft.tagline;

  return (
    <div className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.15)] sm:w-[300px]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-blue-700 to-blue-900">
        {aircraft.heroImageUrl ? (
          <Image
            src={aircraft.heroImageUrl}
            alt={aircraft.name}
            fill
            className="object-cover"
            sizes="300px"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-navy-900">
          {categoryLabel}
        </span>
        <CompareButton
          slug={aircraft.slug}
          name={aircraft.name}
          imageUrl={aircraft.heroImageUrl}
          categoryLabel={categoryLabel}
          variant="card"
        />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <h4 className="font-display text-base font-semibold leading-snug text-navy-900">{aircraft.name}</h4>
          <p className="text-xs text-slate-500">
            {aircraft.manufacturer} {aircraft.model}
          </p>
        </div>

        <dl className="flex items-center gap-3 border-y border-slate-100 py-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <dd className="spec-readout text-navy-900">{aircraft.passengerCapacity}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPinned className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <dd className="spec-readout text-navy-900">{aircraft.rangeNm.toLocaleString()} nm</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <dd className="spec-readout text-navy-900">{aircraft.cruisingSpeedKts.toLocaleString()} kts</dd>
          </div>
        </dl>

        {(aircraft.petFriendly || aircraft.wifiAvailable || missions.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {missions.filter(isMissionType).map((mission) => (
              <span
                key={mission}
                className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-blue-700"
              >
                {MISSION_TYPE_LABELS[mission]}
              </span>
            ))}
            {aircraft.petFriendly ? (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                <PawPrint className="h-3 w-3" aria-hidden="true" /> Pet friendly
              </span>
            ) : null}
            {aircraft.wifiAvailable ? (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                <Wifi className="h-3 w-3" aria-hidden="true" /> Wi-Fi
              </span>
            ) : null}
          </div>
        )}

        {explanation ? <p className="text-xs leading-relaxed text-slate-600">{explanation}</p> : null}

        <div className="mt-1 flex items-center gap-2">
          <CardActionLink href={`/fleet/${aircraft.slug}`} variant="outline">
            View Aircraft
          </CardActionLink>
          <CardActionLink href={buildRequestQuoteHref(tripDraft, aircraft.slug)} variant="primary">
            Request Charter
          </CardActionLink>
        </div>
      </div>
    </div>
  );
}