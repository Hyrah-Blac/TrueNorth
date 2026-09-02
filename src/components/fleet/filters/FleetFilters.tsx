"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  AirplaneTilt,
  Airplane,
  AirplaneInFlight,
  AirTrafficControl,
  Ambulance,
  Binoculars,
  Globe,
  Package,
  Wrench,
} from "@phosphor-icons/react";
import { fleetCategories } from "@/content/fleet-categories";
import type { AircraftCategory } from "@/database/constants/aircraft";
import type { FleetFilterCounts } from "@/features/aircraft/lib/getAircraft";

const CATEGORY_ICONS: Record<AircraftCategory, Icon> = {
  helicopter: AirTrafficControl,
  turboprop: AirplaneTilt,
  light_jet: Airplane,
  heavy_jet: AirplaneInFlight,
  utility: Wrench,
  medevac: Ambulance,
  safari: Binoculars,
  cargo: Package,
};

// Fades the leading/trailing edge of a horizontally-scrollable row on
// mobile, so an overflowing list reads as "more content" rather than
// getting clipped mid-word. Same pattern (and md breakpoint) as
// DestinationsExplorer, which this component's layout mirrors.
const SCROLL_FADE_MASK =
  "[mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] md:[mask-image:none]";

export function FleetFilters({
  activeCategory,
  filterCounts,
}: {
  activeCategory?: AircraftCategory;
  filterCounts?: FleetFilterCounts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      className={`mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.02] transition-opacity duration-300 sm:mt-7 sm:p-4 md:mt-8 md:flex-row md:items-center lg:p-5 ${
        isPending ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {/* Aircraft category — bordered pills with icons, same treatment
          DestinationsExplorer gives its category chips. Categories with
          zero matches in the database are greyed out and inert rather
          than leading to a dead-end empty state. */}
      <div className={`scrollbar-none flex gap-2 overflow-x-auto pb-px md:flex-wrap ${SCROLL_FADE_MASK}`}>
        <button
          type="button"
          onClick={() => updateParam("category", "")}
          aria-pressed={!activeCategory}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.6875rem] font-medium tracking-wide whitespace-nowrap transition-all duration-300 lg:text-xs ${
            !activeCategory
              ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
              : "border-slate-200 bg-slate-50/70 text-slate-500 hover:border-slate-300 hover:bg-white hover:text-navy-900 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.06)]"
          }`}
        >
          <Globe className="h-3 w-3" weight={!activeCategory ? "fill" : "regular"} aria-hidden="true" />
          All
        </button>
        {fleetCategories.map((item) => {
          const ChipIcon = CATEGORY_ICONS[item.category];
          const isActive = activeCategory === item.category;
          const count = filterCounts?.categoryCounts[item.category];
          const isAvailable = count === undefined || count > 0 || isActive;

          return (
            <button
              key={item.category}
              type="button"
              onClick={() => isAvailable && updateParam("category", item.category)}
              disabled={!isAvailable}
              aria-pressed={isActive}
              aria-disabled={!isAvailable}
              title={
                isAvailable ? item.label : `No ${item.label.toLowerCase()} currently available`
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.6875rem] font-medium tracking-wide whitespace-nowrap transition-all duration-300 lg:text-xs ${
                isActive
                  ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
                  : isAvailable
                    ? "border-slate-200 bg-slate-50/70 text-slate-500 hover:border-slate-300 hover:bg-white hover:text-navy-900 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.06)]"
                    : "cursor-not-allowed border-slate-100 bg-slate-50/60 text-slate-300"
              }`}
            >
              <ChipIcon className="h-3 w-3" weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              {item.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}