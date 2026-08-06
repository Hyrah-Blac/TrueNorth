"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
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
  const [passengerMenuOpen, setPassengerMenuOpen] = useState(false);
  const passengerMenuRef = useRef<HTMLDivElement>(null);

  const activeMinPassengers = searchParams.get("minPassengers") ?? "";
  const hasActiveFilters = Boolean(activeCategory) || Boolean(activeMinPassengers);
  const activePassengerLabel =
    PASSENGER_OPTIONS.find((option) => option.value === activeMinPassengers)?.label ?? "Any size";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (passengerMenuRef.current && !passengerMenuRef.current.contains(event.target as Node)) {
        setPassengerMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      className={`flex flex-col gap-8 border-y border-slate-200/70 py-10 transition-opacity duration-300 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-editorial text-lg font-light text-navy-900 sm:text-xl">Filter the Fleet</p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[0.625rem] font-medium uppercase tracking-[0.15em] text-slate-400 transition-colors duration-300 hover:text-navy-900"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* Category tabs — a slim champagne underline marks the active
          state; everything else stays quiet so the accent color reads
          as a deliberate signal, not decoration. */}
      <div className="flex flex-wrap gap-x-9 gap-y-4">
        <button
          type="button"
          onClick={() => updateParam("category", "")}
          className={`border-b pb-2 font-display text-[0.8125rem] font-medium tracking-tight transition-colors duration-300 ${
            !activeCategory
              ? "border-champagne-400 text-navy-900"
              : "border-transparent text-slate-400 hover:text-navy-700"
          }`}
        >
          All categories
        </button>
        {fleetCategories.map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => updateParam("category", item.category)}
            className={`border-b pb-2 font-display text-[0.8125rem] font-medium tracking-tight transition-colors duration-300 ${
              activeCategory === item.category
                ? "border-champagne-400 text-navy-900"
                : "border-transparent text-slate-400 hover:text-navy-700"
            }`}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-5 border-t border-slate-200/70 pt-7">
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-slate-400">
          Passengers
        </span>

        {/* Custom dropdown — native <select>/<option> styling is OS-controlled
            (that gray highlight and blue link text can't be overridden), so
            this is a button + floating panel built to match the site's
            hairline-underline language instead. */}
        <div ref={passengerMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setPassengerMenuOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={passengerMenuOpen}
            className="flex items-center gap-2 border-b border-slate-300 pb-1.5 font-display text-[0.8125rem] font-medium text-navy-900 transition-colors duration-300 hover:border-slate-500"
          >
            {activePassengerLabel}
            <ChevronDown
              className={`h-3 w-3 text-slate-400 transition-transform duration-300 ${
                passengerMenuOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {passengerMenuOpen ? (
            <ul
              role="listbox"
              className="absolute left-0 top-full z-10 mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-soft"
            >
              {PASSENGER_OPTIONS.map((option) => (
                <li key={option.value} role="option" aria-selected={option.value === activeMinPassengers}>
                  <button
                    type="button"
                    onClick={() => {
                      updateParam("minPassengers", option.value);
                      setPassengerMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left font-display text-[0.8125rem] font-medium transition-colors duration-300 ${
                      option.value === activeMinPassengers
                        ? "text-navy-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-navy-800"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}