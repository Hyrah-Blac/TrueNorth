import { AircraftCard } from "@/components/fleet/cards/AircraftCard";
import type { IAircraft } from "@/types/aircraft";

export function RelatedAircraft({ items }: { items: IAircraft[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-sky-600">You might also consider</p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-navy-900">Similar aircraft</h2>
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((aircraft) => (
          <AircraftCard key={aircraft._id} aircraft={aircraft} />
        ))}
      </div>
    </div>
  );
}