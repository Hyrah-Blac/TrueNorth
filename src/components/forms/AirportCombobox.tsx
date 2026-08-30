import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import type { AirportOption } from "@/features/airport/hooks/useAirports";

interface AirportComboboxProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  airports: AirportOption[];
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  /** Airports are loading from the database — show a hint instead of "no matches". */
  isLoading?: boolean;
}

/**
 * A custom, fully-styled searchable dropdown for airport selection. Native
 * <select> popups are rendered by the browser/OS — they can't be restyled
 * with CSS (the plain list with the default blue highlight some people
 * notice on mobile is that native picker, not our styling). This
 * component reimplements the same choice with our own markup instead, so
 * the panel, highlight color, and row layout can actually be designed.
 *
 * Unlike TextInput/Select, this owns its own label rather than being
 * wrapped in <FormField>. FormField floats its label via the CSS
 * `:placeholder-shown` pseudo-class, which behaves inconsistently across
 * browsers on readOnly inputs — that mismatch was letting the label and
 * the selected value render stacked on top of each other rather than
 * cleanly separated. Driving the float from `open`/`selected` state
 * directly removes that ambiguity entirely.
 */
export function AirportCombobox({
  id,
  label,
  required,
  error,
  airports,
  value,
  onChange,
  onBlur,
  hasError,
  isLoading,
}: AirportComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `${id}-listbox`;

  const selected = airports.find((airport) => airport.code === value) ?? null;
  const floated = open || Boolean(selected);
  const showsError = hasError || Boolean(error);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return airports;
    // Defensive against any future bad record slipping through (e.g. a
    // manually-added airport missing a field): optional chaining here
    // means one malformed entry can no longer crash the whole picker
    // the moment the user starts typing, it just won't match the search.
    return airports.filter(
      (airport) =>
        airport.name?.toLowerCase().includes(q) ||
        airport.city?.toLowerCase().includes(q) ||
        airport.country?.toLowerCase().includes(q) ||
        airport.code?.toLowerCase().includes(q),
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

  return (
    <div>
      <div ref={rootRef} className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          readOnly={!open}
          value={open ? query : (selected ? `${selected.name} (${selected.code})` : "")}
          onFocus={openList}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlighted(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Closes on blur (Tab, clicking straight into another field,
            // etc), not just on an outside click — otherwise tabbing away
            // left the panel open while focus moved elsewhere.
            setOpen(false);
            onBlur?.();
          }}
          className={`peer w-full cursor-pointer truncate rounded-md border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 outline-none transition-colors duration-200 ${
            showsError
              ? "border-red-300 focus:border-red-400"
              : "border-slate-200 hover:border-slate-300 focus:border-sky-500"
          }`}
        />
        {/* Own label, floated explicitly from `floated` state rather than
            the CSS :placeholder-shown trick FormField's label relies on —
            see the component doc comment for why. */}
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-3.5 origin-left text-sm text-slate-500 transition-all duration-200 ease-editorial ${
            floated ? "top-2.5 -translate-y-0 text-xs" : "top-1/2 -translate-y-1/2"
          } ${open ? "text-sky-600" : ""}`}
        >
          {label} {required ? <span className="text-sky-600">*</span> : null}
        </label>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-lifted ring-1 ring-black/[0.03]"
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
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}