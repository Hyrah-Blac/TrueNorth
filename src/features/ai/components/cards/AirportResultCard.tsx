import { MapPin, PlaneTakeoff, PlaneLanding, Check } from "lucide-react";
import { useConcierge } from "../../context/ConciergeContext";
import type { AirportSummary } from "../../types";

export function AirportResultCard({ airport }: { airport: AirportSummary }) {
  const { tripDraft, setTripDraftAirport, clearTripDraftAirport } = useConcierge();
  const isDeparture = tripDraft.departureAirportCode === airport.icao;
  const isDestination = tripDraft.destinationAirportCode === airport.icao;

  function handleDepartureClick() {
    if (isDeparture) {
      clearTripDraftAirport("departure");
    } else {
      setTripDraftAirport("departure", airport.icao, airport.name);
    }
  }

  function handleDestinationClick() {
    if (isDestination) {
      clearTripDraftAirport("destination");
    } else {
      setTripDraftAirport("destination", airport.icao, airport.name);
    }
  }

  return (
    // Flat, flush card — no elevation shadow and no hover lift. Stripped
    // to identity (marker, name, location) plus the one action this card
    // exists for — assigning the airport as departure or destination.
    // The spec readout, feature tags, and description copy are gone.
    <div className="w-[260px] shrink-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-colors duration-300 ease-editorial hover:border-blue-200 sm:w-[280px]">
      <div className="flex items-start gap-2.5">
        {/* rounded-lg, not rounded-full — this is a location marker, not
            the concierge persona, so it stays in the blue action-color
            family rather than picking up the champagne avatar treatment;
            just squared off to match the "elegant rectangle" brand rule.
            No shadow — flat, matching the card it sits in. */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h4 className="flex items-baseline gap-1.5 font-editorial text-[15px] font-normal leading-snug tracking-[-0.006em] text-navy-900">
            <span className="truncate">{airport.name}</span>
            <span className="inline-flex shrink-0 items-center rounded-[3px] border border-slate-200 px-1 py-px">
              <span className="spec-readout text-[8px] font-medium uppercase tracking-[0.18em] leading-none text-slate-400">
                {airport.icao}
              </span>
            </span>
          </h4>
          <p className="mt-0.5 font-body text-[9.5px] font-medium uppercase tracking-wide text-slate-500">
            {airport.city}, {airport.country}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={handleDepartureClick}
          aria-pressed={isDeparture}
          title={isDeparture ? "Remove as departure" : "Set as departure"}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 font-display text-[9.5px] font-medium uppercase tracking-wide transition-colors duration-300 ${
            isDeparture
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-300 text-navy-900 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          {isDeparture ? (
            <Check className="h-2.5 w-2.5" aria-hidden="true" />
          ) : (
            <PlaneTakeoff className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          Departure
        </button>
        <button
          type="button"
          onClick={handleDestinationClick}
          aria-pressed={isDestination}
          title={isDestination ? "Remove as destination" : "Set as destination"}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 font-display text-[9.5px] font-medium uppercase tracking-wide transition-colors duration-300 ${
            isDestination
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-slate-300 text-navy-900 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          {isDestination ? (
            <Check className="h-2.5 w-2.5" aria-hidden="true" />
          ) : (
            <PlaneLanding className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          Destination
        </button>
      </div>
    </div>
  );
}