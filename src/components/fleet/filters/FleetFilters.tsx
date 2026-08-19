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

const PASSENGER_OPTIONS = [
  { label: "Any size", value: "" },
  { label: "4+", full: "4+ passengers", value: "4" },
  { label: "8+", full: "8+ passengers", value: "8" },
  { label: "12+", full: "12+ passengers", value: "12" },
];

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
// getting clipped mid-word.
const SCROLL_FADE_MASK =
  "[mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:[mask-image:none]";

export function FleetFilters({ activeCategory }: { activeCategory?: AircraftCategory }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeMinPassengers = searchParams.get("minPassengers") ?? "";

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
      className={`mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.02] transition-opacity duration-300 sm:mt-7 sm:gap-3.5 sm:p-3.5 md:mt-8 lg:p-4 ${
        isPending ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-5">
        {/* Aircraft category — quiet text tabs; the active state is
            marked only by a champagne ring around the icon and a shift
            to navy text, no underline or fill. */}
        <div
          className={`scrollbar-none flex gap-1.5 overflow-x-auto pb-px sm:flex-wrap ${SCROLL_FADE_MASK}`}
        >
          <button
            type="button"
            onClick={() => updateParam("category", "")}
            aria-pressed={!activeCategory}
            className={`inline-flex min-h-[1.75rem] shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-display text-[0.6875rem] font-medium tracking-tight whitespace-nowrap transition-all duration-300 ${
              !activeCategory
                ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-navy-900"
            }`}
          >
            <Globe className="h-3 w-3" weight={!activeCategory ? "fill" : "regular"} aria-hidden="true" />
            All
          </button>
          {fleetCategories.map((item) => {
            const ChipIcon = CATEGORY_ICONS[item.category];
            const isActive = activeCategory === item.category;
            return (
              <button
                key={item.category}
                type="button"
                onClick={() => updateParam("category", item.category)}
                aria-pressed={isActive}
                title={item.label}
                className={`inline-flex min-h-[1.75rem] shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-display text-[0.6875rem] font-medium tracking-tight whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-navy-900"
                }`}
              >
                <ChipIcon className="h-3 w-3" weight={isActive ? "fill" : "regular"} aria-hidden="true" />
                {item.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Horizontal hairline on mobile/tablet where the two groups
            stack, vertical hairline once they sit side by side. */}
        <div className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-slate-200 to-transparent sm:hidden" aria-hidden="true" />
        <div
          className="hidden h-5 w-px shrink-0 bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block"
          aria-hidden="true"
        />

        <div className={`scrollbar-none flex gap-x-3 overflow-x-auto pb-px sm:gap-x-3.5 ${SCROLL_FADE_MASK}`}>
          {PASSENGER_OPTIONS.map((option) => {
            const isActive = activeMinPassengers === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateParam("minPassengers", option.value)}
                aria-pressed={isActive}
                title={option.full ?? option.label}
                className={`flex min-h-[1.75rem] shrink-0 items-center pb-px font-display text-[0.6875rem] font-medium tracking-tight whitespace-nowrap transition-colors duration-300 ${
                  isActive ? "text-navy-900" : "text-slate-400 hover:text-navy-700"
                }`}
              >
                <span className="sm:hidden">{option.label}</span>
                <span className="hidden sm:inline">{option.full ?? option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}