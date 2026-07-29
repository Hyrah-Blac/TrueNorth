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

  const activeMinPassengers = searchParams.get("minPassengers") ?? "";
  const hasActiveFilters = Boolean(activeCategory) || Boolean(activeMinPassengers);

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

  function clearFilters() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <div
      className={`flex flex-col gap-5 border-b border-slate-200/80 bg-white px-6 py-6 transition-opacity duration-300 lg:px-10 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-sm font-semibold text-navy-900">Filter the Fleet</p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-sky-600 transition-colors hover:text-sky-700"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParam("category", "")}
          className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 ${
            !activeCategory
              ? "bg-navy-900 text-white shadow-soft"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All categories
        </button>
        {fleetCategories.map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => updateParam("category", item.category)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 ${
              activeCategory === item.category
                ? "bg-navy-900 text-white shadow-soft"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <label className="text-xs font-medium text-slate-600" htmlFor="min-passengers">
          Passengers
        </label>
        <select
          id="min-passengers"
          defaultValue={activeMinPassengers}
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