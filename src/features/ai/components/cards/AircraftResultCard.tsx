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
  const { tripDraft, setTripDraftAircraft } = useConcierge();
  const categoryLabel =
    aircraft.category in AIRCRAFT_CATEGORY_LABELS
      ? AIRCRAFT_CATEGORY_LABELS[aircraft.category as keyof typeof AIRCRAFT_CATEGORY_LABELS]
      : aircraft.category;

  const missions = aircraft.recommendedMissionTypes.slice(0, 2);
  const explanation = aircraft.aiNotes || aircraft.aiStrengths[0] || aircraft.tagline;
  const manufacturerModel = `${aircraft.manufacturer} ${aircraft.model}`.trim();
  // Some aircraft records use "Manufacturer Model" as the display name
  // too (e.g. "Cessna Citation XLS+" / "Cessna Citation XLS+"), which
  // renders as visible, pointless repetition right under the title —
  // only show the subtitle when it actually adds information.
  const showManufacturerModel = manufacturerModel.toLowerCase() !== aircraft.name.trim().toLowerCase();

  return (
    // shadow-crisp at rest, lifting to shadow-soft on hover — same
    // premium micro-interaction as the WelcomeScreen prompt cards, so
    // every "tappable card" surface in the concierge behaves the same way.
    <div className="w-[280px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-crisp transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft sm:w-[300px]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
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
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest2 text-navy-900">
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
          <h4 className="font-editorial text-[16px] font-normal leading-snug tracking-[-0.008em] text-navy-900">{aircraft.name}</h4>
          {showManufacturerModel ? (
            <p className="mt-1 font-body text-[10.5px] font-medium uppercase tracking-widest2 text-slate-500">
              {manufacturerModel}
            </p>
          ) : null}
        </div>

        {explanation ? (
          <p className="line-clamp-2 font-body text-[13px] leading-relaxed text-slate-600">{explanation}</p>
        ) : null}

        <dl className="flex items-center gap-3 border-y border-slate-100 py-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
            <dd className="spec-readout font-semibold text-navy-900">{aircraft.passengerCapacity}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPinned className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <dd className="spec-readout text-slate-600">{aircraft.rangeNm.toLocaleString()} nm</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <dd className="spec-readout text-slate-600">{aircraft.cruisingSpeedKts.toLocaleString()} kts</dd>
          </div>
        </dl>

        {(aircraft.petFriendly || aircraft.wifiAvailable || missions.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 opacity-80">
            {missions.filter(isMissionType).map((mission) => (
              <span
                key={mission}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-600"
              >
                {MISSION_TYPE_LABELS[mission]}
              </span>
            ))}
            {aircraft.petFriendly ? (
              <span className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-600">
                <PawPrint className="h-2.5 w-2.5" aria-hidden="true" /> Pet friendly
              </span>
            ) : null}
            {aircraft.wifiAvailable ? (
              <span className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-600">
                <Wifi className="h-2.5 w-2.5" aria-hidden="true" /> Wi-Fi
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2">
          <CardActionLink
            href={`/fleet/${aircraft.slug}`}
            variant="outline"
            onClick={() => setTripDraftAircraft(aircraft.slug)}
          >
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