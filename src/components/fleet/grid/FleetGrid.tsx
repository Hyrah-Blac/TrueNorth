import { PlaneTakeoff } from "lucide-react";
import { AircraftCard } from "../cards/AircraftCard";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import type { IAircraft } from "@/types/aircraft";

export function FleetGrid({ items }: { items: IAircraft[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<PlaneTakeoff className="h-5 w-5" aria-hidden="true" />}
        title="No aircraft match those filters"
        description="Try widening your search, or tell us the mission directly and we'll recommend the right aircraft."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {items.map((aircraft, index) => (
        <AircraftCard key={aircraft._id} aircraft={aircraft} reversed={index % 2 === 1} />
      ))}
    </div>
  );
}