"use client";

import { useMemo, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Binoculars, Buildings, Globe, MapPinLine, Waves } from "@phosphor-icons/react";
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

const CATEGORY_CHIPS: { value: CategoryFilter; label: string; icon: Icon }[] = [
  { value: "all", label: "All", icon: Globe },
  { value: "safari", label: "Safari", icon: Binoculars },
  { value: "coastal", label: "Coastal", icon: Waves },
  { value: "urban", label: "Urban", icon: Buildings },
  { value: "remote", label: "Remote", icon: MapPinLine },
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
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        <div className="scrollbar-none inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
          {REGION_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRegion(tab.value)}
              aria-pressed={region === tab.value}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${
                region === tab.value
                  ? "bg-navy-900 text-white shadow-soft"
                  : "text-slate-500 hover:text-navy-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" aria-hidden="true" />

        <div className="scrollbar-none flex gap-2 overflow-x-auto sm:flex-wrap">
          {CATEGORY_CHIPS.map((chip) => {
            const ChipIcon = chip.icon;
            const isActive = category === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setCategory(chip.value)}
                aria-pressed={isActive}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-navy-900"
                }`}
              >
                <ChipIcon className="h-3.5 w-3.5" weight={isActive ? "fill" : "regular"} aria-hidden="true" />
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

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