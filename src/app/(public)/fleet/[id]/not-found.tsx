import { NotFound } from "@/components/feedback/NotFound/NotFound";

export default function AircraftNotFound() {
  return (
    <NotFound
      title="We couldn't find that aircraft"
      description="It may have been removed from the fleet or the link is out of date."
      actionLabel="Browse the Fleet"
      actionHref="/fleet"
    />
  );
}
