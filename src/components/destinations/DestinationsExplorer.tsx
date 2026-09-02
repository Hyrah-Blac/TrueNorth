"use client";

import { useMemo, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Binoculars, Buildings, Globe, MapPinLine, Waves } from "@phosphor-icons/react";
import { DestinationCard } from "./DestinationCard";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { destinations, type Destination } from "@/content/destinations";

type RegionFilter = "all" | Destination["region"];
type CategoryFilter = "all" | Destination["category"];

// Fades the leading/trailing edge of a horizontally-scrollable row on
// mobile, so an overflowing list reads as "more content" rather than
// getting clipped mid-word. Same pattern used in FleetFilters/FilterTabs/
// StatusFilterTabs — this component just hadn't picked it up yet.
const SCROLL_FADE_MASK =
  "[mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] md:[mask-image:none]";

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
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.02] sm:p-4 md:flex-row md:items-center md:gap-5 lg:gap-6 lg:p-5">
        <div className={`scrollbar-none inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-slate-100/80 p-1 ring-1 ring-inset ring-slate-900/[0.04] ${SCROLL_FADE_MASK}`}>
          {REGION_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRegion(tab.value)}
              aria-pressed={region === tab.value}
              className={`font-display shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-tight whitespace-nowrap transition-all duration-300 lg:text-[0.8125rem] ${
                region === tab.value
                  ? "bg-gradient-to-b from-navy-800 to-navy-950 text-white shadow-soft"
                  : "text-slate-500 hover:bg-white/70 hover:text-navy-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="hidden h-6 w-px shrink-0 bg-gradient-to-b from-transparent via-slate-200 to-transparent md:block"
          aria-hidden="true"
        />

        <div className={`scrollbar-none flex gap-2 overflow-x-auto pb-px md:flex-wrap ${SCROLL_FADE_MASK}`}>
          {CATEGORY_CHIPS.map((chip) => {
            const ChipIcon = chip.icon;
            const isActive = category === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setCategory(chip.value)}
                aria-pressed={isActive}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-300 lg:text-[0.8125rem] ${
                  isActive
                    ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
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