"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, MapPin, PlaneTakeoff, PlaneLanding } from "lucide-react";
import type { AirportOption } from "@/features/airport/hooks/useAirports";

interface AirportPillFieldProps {
  id: string;
  placeholder: string;
  /** "from" shows a departing-plane icon, "to" a landing-plane icon — matches the reference design's From/To glyphs. */
  direction: "from" | "to";
  airports: AirportOption[];
  isLoading?: boolean;
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

/**
 * From/To airport picker styled as a plain pill segment (icon + text, no
 * border, no floating label) for use inside TripSearchBar — a restyled
 * sibling of AirportCombobox, which is built for the bordered/floating-
 * label look the rest of the form's fields use and doesn't fit this bar.
 */
export function AirportPillField({
  id,
  placeholder,
  direction,
  airports,
  isLoading,
  value,
  onChange,
  error,
}: AirportPillFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `${id}-listbox`;

  const selected = airports.find((airport) => airport.code === value) ?? null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return airports;
    return airports.filter(
      (airport) =>
        airport.name.toLowerCase().includes(q) ||
        airport.city.toLowerCase().includes(q) ||
        airport.country.toLowerCase().includes(q) ||
        airport.code.toLowerCase().includes(q),
    );
  }, [airports, query]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function openList() {
    setOpen(true);
    setQuery("");
    setHighlighted(Math.max(results.findIndex((a) => a.code === value), 0));
  }

  function selectAirport(airport: AirportOption) {
    onChange(airport.code);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      openList();
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const airport = results[highlighted];
      if (airport) selectAirport(airport);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  const Icon = direction === "from" ? PlaneTakeoff : PlaneLanding;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-navy-900" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            readOnly={!open}
            value={open ? query : (selected ? `${selected.city} (${selected.code})` : "")}
            onFocus={openList}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-w-0 cursor-pointer truncate bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-500 sm:text-base"
          />
          {selected ? <span className="block truncate text-xs text-slate-400">{selected.name}</span> : null}
        </div>
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute bottom-[calc(100%+10px)] left-0 right-0 z-20 max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-lifted ring-1 ring-black/[0.03] sm:right-auto sm:w-72"
        >
          {isLoading ? (
            <li className="flex items-center justify-center gap-2 px-3.5 py-6 text-center text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Loading airports&hellip;
            </li>
          ) : results.length === 0 ? (
            <li className="px-3.5 py-6 text-center text-xs text-slate-400">
              {query ? <>No airports match &ldquo;{query}&rdquo;</> : "No airports available"}
            </li>
          ) : (
            results.map((airport, index) => {
              const isSelected = airport.code === value;
              const isHighlighted = index === highlighted;
              return (
                <li key={airport.code} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectAirport(airport)}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors duration-150 ${
                      isHighlighted ? "bg-sky-50" : ""
                    }`}
                  >
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${isHighlighted ? "text-sky-500" : "text-slate-300"}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy-900">{airport.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {airport.city}, {airport.country}
                      </span>
                    </span>
                    <span className="spec-readout shrink-0 rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-semibold text-slate-600">
                      {airport.code}
                    </span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
      {error ? (
        <p className="absolute left-0 top-full mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}