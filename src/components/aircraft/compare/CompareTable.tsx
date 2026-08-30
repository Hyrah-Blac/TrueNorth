import { Fragment } from "react";
import Image from "next/image";
import { ImageOff, Check, Minus } from "lucide-react";
import { AIRCRAFT_CATEGORY_LABELS } from "@/database/constants/aircraft";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import type { IAircraft } from "@/types/aircraft";
import type { AirportNameInfo } from "@/lib/api/airportNames";
import { Button } from "@/components/shared/buttons/Button";

interface CompareTableProps {
  aircraft: IAircraft[];
  /** Resolved base-airport names, keyed by uppercased code — see
   * fleet/compare/page.tsx, which fetches this via /api/airports?codes=
   * since this page (and this table) render client-side. Falls back to
   * the raw code when a lookup hasn't resolved (or is still loading),
   * same convention as every other airport display on the site. */
  airportNames?: Record<string, AirportNameInfo>;
  onRemove: (slug: string) => void;
}

interface SpecRowDef {
  label: string;
  render: (aircraft: IAircraft, airportNames: Record<string, AirportNameInfo>) => string;
}

const SPEC_ROWS: SpecRowDef[] = [
  { label: "Manufacturer", render: (a) => a.manufacturer },
  { label: "Model", render: (a) => a.model },
  { label: "Passenger capacity", render: (a) => `${a.passengerCapacity} pax` },
  { label: "Luggage capacity", render: (a) => `${a.luggageCapacityKg} kg` },
  { label: "Range", render: (a) => `${a.rangeNm.toLocaleString()} nm` },
  { label: "Cruising speed", render: (a) => `${a.cruisingSpeedKts.toLocaleString()} kts` },
  {
    label: "Base airport",
    render: (a, airportNames) => {
      const info = airportNames[a.baseAirportCode.toUpperCase()];
      return info ? `${info.name} (${a.baseAirportCode})` : a.baseAirportCode;
    },
  },
  { label: "Cabin height", render: (a) => (a.cabinHeightM ? `${a.cabinHeightM} m` : "—") },
  { label: "Cabin width", render: (a) => (a.cabinWidthM ? `${a.cabinWidthM} m` : "—") },
  { label: "Cabin length", render: (a) => (a.cabinLengthM ? `${a.cabinLengthM} m` : "—") },
];

export function CompareTable({ aircraft, airportNames = {}, onRemove }: CompareTableProps) {
  const allAmenities = Array.from(new Set(aircraft.flatMap((a) => a.amenities))).sort();
  const allMissions = Array.from(new Set(aircraft.flatMap((a) => a.recommendedMissions)));
  const columnWidth = `minmax(220px, 1fr)`;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-soft">
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `200px repeat(${aircraft.length}, ${columnWidth})` }}
      >
        {/* Header row: photo, name, remove, CTA */}
        <div className="sticky left-0 z-10 flex items-end bg-slate-50 p-5">
          <p className="text-[0.6875rem] font-medium text-slate-500">Fleet comparison</p>
        </div>
        {aircraft.map((item) => (
          <div key={item._id} className="border-l border-slate-100 bg-slate-50 p-5">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-navy-950">
              {item.heroImage ? (
                <Image src={item.heroImage.url} alt={item.name} fill className="object-cover" sizes="240px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/30">
                  <ImageOff className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(item.slug)}
                aria-label={`Remove ${item.name} from comparison`}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-navy-900 transition-colors hover:bg-white"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-slate-400">
              {AIRCRAFT_CATEGORY_LABELS[item.category]}
            </p>
            <h3 className="mt-1 font-body text-base font-bold uppercase tracking-tight text-navy-900">{item.name}</h3>
            <Button
              href={`/fleet/${item.slug}`}
              variant="outline"
              size="sm"
              className="mt-3 w-full !text-[10px] hover:!-translate-y-0 hover:!border-slate-300 hover:!text-navy-900"
            >
              View
            </Button>
          </div>
        ))}

        {/* Spec rows */}
        {SPEC_ROWS.map((row, rowIndex) => (
          <Fragment key={row.label}>
            <div
              className={`sticky left-0 z-10 flex items-center px-5 py-3.5 text-xs text-slate-500 ${
                rowIndex % 2 === 1 ? "bg-slate-50" : "bg-white"
              }`}
            >
              {row.label}
            </div>
            {aircraft.map((item) => (
              <div
                key={`${row.label}-${item._id}`}
                className={`flex items-center border-l border-slate-100 px-5 py-3.5 text-xs font-medium text-navy-900 ${
                  rowIndex % 2 === 1 ? "bg-slate-50" : "bg-white"
                }`}
              >
                {row.render(item, airportNames)}
              </div>
            ))}
          </Fragment>
        ))}

        {/* Recommended missions */}
        {allMissions.length > 0 ? (
          <>
            <div className="sticky left-0 z-10 border-t-2 border-slate-200 bg-slate-50 px-5 py-3.5 text-xs font-medium text-navy-900">
              Mission fit
            </div>
            {aircraft.map((item) => (
              <div key={`missions-${item._id}`} className="border-l border-t-2 border-slate-100 border-t-slate-200 bg-slate-50 px-5 py-3.5" />
            ))}
            {allMissions.map((mission, index) => (
              <Fragment key={mission}>
                <div
                  className={`sticky left-0 z-10 px-5 py-3 pl-8 text-xs text-slate-500 ${index % 2 === 1 ? "bg-slate-50" : "bg-white"}`}
                >
                  {MISSION_TYPE_LABELS[mission]}
                </div>
                {aircraft.map((item) => (
                  <div
                    key={`${mission}-${item._id}`}
                    className={`flex items-center justify-center border-l border-slate-100 px-5 py-3 ${
                      index % 2 === 1 ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    {item.recommendedMissions.includes(mission) ? (
                      <Check className="h-3.5 w-3.5 text-navy-900" aria-hidden="true" />
                    ) : (
                      <Minus className="h-3 w-3 text-slate-200" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </Fragment>
            ))}
          </>
        ) : null}

        {/* Amenities */}
        {allAmenities.length > 0 ? (
          <>
            <div className="sticky left-0 z-10 border-t-2 border-slate-200 bg-slate-50 px-5 py-3.5 text-xs font-medium text-navy-900">
              Amenities
            </div>
            {aircraft.map((item) => (
              <div key={`amenities-${item._id}`} className="border-l border-t-2 border-slate-100 border-t-slate-200 bg-slate-50 px-5 py-3.5" />
            ))}
            {allAmenities.map((amenity, index) => (
              <Fragment key={amenity}>
                <div
                  className={`sticky left-0 z-10 px-5 py-3 pl-8 text-xs text-slate-500 ${index % 2 === 1 ? "bg-slate-50" : "bg-white"}`}
                >
                  {amenity}
                </div>
                {aircraft.map((item) => (
                  <div
                    key={`${amenity}-${item._id}`}
                    className={`flex items-center justify-center border-l border-slate-100 px-5 py-3 ${
                      index % 2 === 1 ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    {item.amenities.includes(amenity) ? (
                      <Check className="h-3.5 w-3.5 text-navy-900" aria-hidden="true" />
                    ) : (
                      <Minus className="h-3 w-3 text-slate-200" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </Fragment>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}