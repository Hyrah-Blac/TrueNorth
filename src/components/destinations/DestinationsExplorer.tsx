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
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="spec-readout mb-3 text-xs font-medium uppercase tracking-widest2 text-slate-400">
            Region
          </p>
          <div className="flex flex-wrap gap-2">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setRegion(tab.value)}
                className={`rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
                  region === tab.value
                    ? "bg-navy-900 text-white shadow-soft"
                    : "bg-white text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="spec-readout mb-3 text-xs font-medium uppercase tracking-widest2 text-slate-400 sm:text-right">
            Type
          </p>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setCategory(chip.value)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
                  category === chip.value
                    ? "border-sky-500 bg-sky-100 text-sky-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="spec-readout mt-8 text-xs uppercase tracking-widest2 text-slate-400">
        {filtered.length} {filtered.length === 1 ? "Destination" : "Destinations"}
      </p>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-5 w-5" weight="thin" aria-hidden="true" />}
            title="No destinations match those filters"
            description="Flying somewhere not listed here? Submit a charter request and tell us the route directly."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((destination, index) => (
              <DestinationCard key={destination.slug} destination={destination} reversed={index % 2 !== 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}