"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { fleetCategories } from "@/content/fleet-categories";
import type { AircraftCategory } from "@/database/constants/aircraft";

const PASSENGER_OPTIONS = [
  { label: "Any size", value: "" },
  { label: "4+ passengers", value: "4" },
  { label: "8+ passengers", value: "8" },
  { label: "12+ passengers", value: "12" },
];

export function FleetFilters({ activeCategory }: { activeCategory?: AircraftCategory }) {
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
      className={`sticky top-16 z-30 -mx-6 flex flex-col gap-4 border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur-md transition-opacity duration-300 lg:-mx-10 lg:px-10 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParam("category", "")}
          className={`rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
            !activeCategory ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All categories
        </button>
        {fleetCategories.map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => updateParam("category", item.category)}
            className={`rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
              activeCategory === item.category
                ? "bg-navy-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="min-passengers">
          Passengers
        </label>
        <select
          id="min-passengers"
          defaultValue={searchParams.get("minPassengers") ?? ""}
          onChange={(event) => updateParam("minPassengers", event.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          {PASSENGER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
