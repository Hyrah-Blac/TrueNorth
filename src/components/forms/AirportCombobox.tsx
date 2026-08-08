import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import type { Airport } from "@/content/airports";

interface AirportComboboxProps {
  id: string;
  airports: Airport[];
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  placeholder?: string;
}

/**
 * A custom, fully-styled searchable dropdown for airport selection. Native
 * <select> popups are rendered by the browser/OS — they can't be restyled
 * with CSS (the plain list with the default blue highlight some people
 * notice on mobile is that native picker, not our styling). This
 * component reimplements the same choice with our own markup instead, so
 * the panel, highlight color, and row layout can actually be designed.
 *
 * Renders as a Fragment, not a wrapping div — same convention as Select,
 * so it composes with FormField's floating label (which needs the input
 * to be a direct sibling of the label for the peer-* CSS to work).
 */
export function AirportCombobox({
  id,
  airports,
  value,
  onChange,
  onBlur,
  hasError,
  placeholder = "Select airport",
}: AirportComboboxProps) {
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

  // Close on outside click.
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

  function selectAirport(airport: Airport) {
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

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder=" "
        readOnly={!open}
        value={open ? query : (selected ? `${selected.name} (${selected.code})` : "")}
        onFocus={openList}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlighted(0);
        }}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={`peer w-full cursor-pointer rounded-md border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 outline-none transition-colors duration-200 ${
          hasError
            ? "border-red-300 focus:border-red-400"
            : "border-slate-200 hover:border-slate-300 focus:border-sky-500"
        }`}
      />
      <ChevronDown
        className={`pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform duration-200 peer-focus:text-sky-500 ${
          open ? "rotate-180" : ""
        }`}
        aria-hidden="true"
      />

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-lifted"
        >
          {results.length === 0 ? (
            <li className="px-3.5 py-6 text-center text-xs text-slate-400">
              No airports match &ldquo;{query}&rdquo;
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
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ${
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
                    <span className="spec-readout shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
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
    </div>
  );
}