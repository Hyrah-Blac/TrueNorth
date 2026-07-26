"use client";

import { useMemo, useState } from "react";
import { Globe } from "@phosphor-icons/react";
import { DestinationCard } from "./DestinationCard";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { destinations, type Destination } from "@/content/destinations";

type RegionFilter = "all" | Destination["region"];
type CategoryFilter = "all" | Destination["category"];

const REGION_TABS: { value: RegionFilter; label: string }[] = [
  { value: "all", label: "All Destinations" },
  { value: "domestic", label: "Domestic" },
  { value: "regional", label: "Regional (East Africa)" },
];

const CATEGORY_CHIPS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "safari", label: "Safari" },
  { value: "coastal", label: "Coastal" },
  { value: "urban", label: "Urban" },
  { value: "remote", label: "Remote" },
];

export function DestinationsExplorer() {
  const [region, setRegion] = useState<RegionFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const filtered = useMemo(() => {
    return destinations.filter((destination) => {
      const matchesRegion = region === "all" || destination.region === region;
      const matchesCategory = category === "all" || destination.category === category;
      return matchesRegion && matchesCategory;
    });
  }, [region, category]);

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {REGION_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRegion(tab.value)}
              className={`rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wide ${
                region === tab.value ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setCategory(chip.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium uppercase tracking-wide ${
                category === chip.value
                  ? "border-sky-500 bg-sky-100 text-sky-700"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-5 w-5" weight="thin" aria-hidden="true" />}
            title="No destinations match those filters"
            description="Flying somewhere not listed here? Submit a charter request and tell us the route directly."
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((destination) => (
              <DestinationCard key={destination.slug} destination={destination} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}