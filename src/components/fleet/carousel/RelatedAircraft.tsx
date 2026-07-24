import { AircraftCard } from "@/components/fleet/cards/AircraftCard";
import type { IAircraft } from "@/types/aircraft";

export function RelatedAircraft({ items }: { items: IAircraft[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="spec-readout text-xs uppercase tracking-widest2 text-sky-600">You Might Also Consider</p>
      <h2 className="mt-2 font-editorial text-3xl font-light italic text-navy-900">Similar aircraft</h2>
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((aircraft, index) => (
          <div
            key={aircraft._id}
            className="animate-fade-up-editorial"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <AircraftCard aircraft={aircraft} />
          </div>
        ))}
      </div>
    </div>
  );
}
