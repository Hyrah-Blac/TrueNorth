import { PlaneTakeoff } from "lucide-react";
import { AircraftCard } from "../cards/AircraftCard";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { Button } from "@/components/shared/buttons/Button";
import type { IAircraft } from "@/types/aircraft";

export function FleetGrid({ items }: { items: IAircraft[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<PlaneTakeoff className="h-5 w-5" aria-hidden="true" />}
        title="No aircraft match those filters"
        description="Try widening your search, or tell us the mission directly and we'll recommend the right aircraft."
        action={
          <Button href="/request-charter" variant="outline">
            Request Charter Instead
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((aircraft, index) => (
        <div
          key={aircraft._id}
          className="animate-fade-up-editorial"
          style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
        >
          <AircraftCard aircraft={aircraft} />
        </div>
      ))}
    </div>
  );
}
