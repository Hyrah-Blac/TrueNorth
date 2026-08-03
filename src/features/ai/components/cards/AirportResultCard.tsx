import { MapPin, Fuel, Moon, ShieldCheck, Cross, PlaneTakeoff, PlaneLanding, Check } from "lucide-react";
import { useConcierge } from "../../context/ConciergeContext";
import type { AirportSummary } from "../../types";

const FEATURE_ICONS: Array<{
  key: keyof Pick<AirportSummary, "fuelAvailable" | "nightOperations" | "customsAvailable" | "medicalSupport">;
  label: string;
  Icon: typeof Fuel;
}> = [
  { key: "fuelAvailable", label: "Fuel available", Icon: Fuel },
  { key: "nightOperations", label: "Night operations", Icon: Moon },
  { key: "customsAvailable", label: "Customs", Icon: ShieldCheck },
  { key: "medicalSupport", label: "Medical support", Icon: Cross },
];

export function AirportResultCard({ airport }: { airport: AirportSummary }) {
  const { tripDraft, setTripDraftAirport } = useConcierge();
  const activeFeatures = FEATURE_ICONS.filter((feature) => airport[feature.key]);
  const isDeparture = tripDraft.departureAirportCode === airport.icao;
  const isDestination = tripDraft.destinationAirportCode === airport.icao;

  return (
    <div className="w-[260px] shrink-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.15)] sm:w-[280px]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <MapPin className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h4 className="font-display text-sm font-semibold leading-snug text-navy-900">{airport.name}</h4>
          <p className="text-xs text-slate-500">
            {airport.city}, {airport.country}
          </p>
        </div>
      </div>

      <dl className="mt-3 flex items-center gap-3 border-y border-slate-100 py-2.5">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500">ICAO</dt>
          <dd className="spec-readout text-navy-900">{airport.icao}</dd>
        </div>
        {airport.iata ? (
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">IATA</dt>
            <dd className="spec-readout text-navy-900">{airport.iata}</dd>
          </div>
        ) : null}
        {airport.runwayLengthM ? (
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Runway</dt>
            <dd className="spec-readout text-navy-900">{airport.runwayLengthM.toLocaleString()} m</dd>
          </div>
        ) : null}
      </dl>

      {activeFeatures.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeFeatures.map(({ key, label, Icon }) => (
            <span
              key={key}
              className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-blue-700"
            >
              <Icon className="h-3 w-3 text-blue-600" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {airport.notes ? <p className="mt-3 text-xs leading-relaxed text-slate-600">{airport.notes}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTripDraftAirport("departure", airport.icao, airport.name)}
          aria-pressed={isDeparture}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium uppercase tracking-wide transition-colors duration-300 ${
            isDeparture
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-300 text-navy-900 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          {isDeparture ? (
            <Check className="h-3 w-3" aria-hidden="true" />
          ) : (
            <PlaneTakeoff className="h-3 w-3" aria-hidden="true" />
          )}
          Departure
        </button>
        <button
          type="button"
          onClick={() => setTripDraftAirport("destination", airport.icao, airport.name)}
          aria-pressed={isDestination}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium uppercase tracking-wide transition-colors duration-300 ${
            isDestination
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-300 text-navy-900 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          {isDestination ? (
            <Check className="h-3 w-3" aria-hidden="true" />
          ) : (
            <PlaneLanding className="h-3 w-3" aria-hidden="true" />
          )}
          Destination
        </button>
      </div>
    </div>
  );
}