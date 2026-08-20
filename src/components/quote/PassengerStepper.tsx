"use client";

import { Minus, Plus } from "lucide-react";

interface PassengerStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/**
 * "− N Passenger(s) +" segment used inside TripSearchBar. Renders the
 * decrement/increment buttons directly in the bar (matching the
 * VistaJet reference) rather than behind a click-to-open popover — the
 * count and both controls are visible and usable in one glance, no
 * extra interaction needed just to see them. Sized to match the bar's
 * generous, premium proportions — the buttons are a real tap target,
 * not a cramped icon. No leading icon here — matches the reference,
 * which leaves the passenger segment icon-free (unlike From/To/Date).
 */
export function PassengerStepper({ value, onChange, min = 1, max = 100 }: PassengerStepperProps) {
  function decrement() {
    onChange(Math.max(min, value - 1));
  }

  function increment() {
    onChange(Math.min(max, value + 1));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease passengers"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-navy-900/30 text-navy-900 transition-colors hover:border-sky-500 hover:text-sky-600 disabled:pointer-events-none disabled:border-navy-900/20 disabled:text-navy-900/40"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <span className="whitespace-nowrap text-sm text-navy-900 sm:text-base">
        {value} {value === 1 ? "Passenger" : "Passengers"}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase passengers"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-navy-900/30 text-navy-900 transition-colors hover:border-sky-500 hover:text-sky-600 disabled:pointer-events-none disabled:border-navy-900/20 disabled:text-navy-900/40"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}