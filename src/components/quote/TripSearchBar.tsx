"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { AirportPillField } from "./AirportPillField";
import { DateRangeField } from "./DateRangeField";
import { PassengerStepper } from "./PassengerStepper";
import { useAirports } from "@/features/airport/hooks/useAirports";

export interface TripSearchBarValues {
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  returnDate?: string;
  isRoundTrip: boolean;
  departureTimePreference?: string;
  passengerCount: number;
}

interface TripSearchBarErrors {
  departureAirportCode?: string;
  destinationAirportCode?: string;
  departureDate?: string;
  returnDate?: string;
}

interface TripSearchBarProps {
  values: TripSearchBarValues;
  onChange: <K extends keyof TripSearchBarValues>(field: K, value: TripSearchBarValues[K]) => void;
  errors?: TripSearchBarErrors;
  /** Shows the arrow submit button and fires onSubmit — used on step 1. Step 2 renders the bar without it, since the trip details are already confirmed. */
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

/**
 * The horizontal "From / To / Date / Passengers [→]" pill, modeled on
 * VistaJet's charter-request search bar. Rendered on both steps of the
 * request flow — step 1 as the primary call to action (with the arrow
 * button), step 2 as an already-filled summary the customer can still
 * adjust without starting over.
 *
 * Sized generously on purpose (tall row, wide gutters, a big round CTA)
 * — this is the first thing a visitor interacts with on the page, so it
 * needs to read as a premium, unhurried control rather than a cramped
 * utility bar. From/To/Date flex to fill available width; Passengers
 * and the arrow button stay a fixed size so their +/- controls always
 * have breathing room instead of being squeezed by flex-1.
 *
 * The trailing arrow starts as a bare glyph with no button chrome (no
 * circle, no fill), muted and inert, sitting flush inside the pill while
 * From/To/Date are incomplete. Once the trip is fully filled in, it
 * flips to a solid blue, full-bleed cap that fills the pill's trailing
 * edge — same spot, but now a proper CTA the eye lands on.
 */
export function TripSearchBar({ values, onChange, errors, onSubmit, isSubmitting }: TripSearchBarProps) {
  const { airports, isLoading: airportsLoading } = useAirports();

  const isReady = Boolean(values.departureAirportCode && values.destinationAirportCode && values.departureDate);

  return (
    <div className="flex flex-col lining-nums rounded-3xl border border-slate-400 bg-white sm:flex-row sm:items-stretch sm:rounded-full sm:border-navy-950/25 sm:shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 flex-1 items-center px-6 py-6 sm:py-3 [&>*]:min-w-0 [&>*]:flex-1">
        <AirportPillField
          id="departureAirportCode"
          direction="from"
          placeholder="From"
          airports={airports}
          isLoading={airportsLoading}
          value={values.departureAirportCode}
          onChange={(code) => onChange("departureAirportCode", code)}
          error={errors?.departureAirportCode}
        />
      </div>

      <div className="hidden h-10 w-px shrink-0 self-center bg-navy-950/20 sm:block" />
      <div className="h-px w-full shrink-0 bg-slate-200 sm:hidden" />

      <div className="flex min-w-0 flex-1 items-center px-6 py-6 sm:py-3 [&>*]:min-w-0 [&>*]:flex-1">
        <AirportPillField
          id="destinationAirportCode"
          direction="to"
          placeholder="To"
          airports={airports}
          isLoading={airportsLoading}
          value={values.destinationAirportCode}
          onChange={(code) => onChange("destinationAirportCode", code)}
          error={errors?.destinationAirportCode}
        />
      </div>

      <div className="hidden h-10 w-px shrink-0 self-center bg-navy-950/20 sm:block" />
      <div className="h-px w-full shrink-0 bg-slate-200 sm:hidden" />

      <div className="flex min-w-0 flex-1 items-center sm:px-6 sm:py-3 [&>*]:min-w-0 [&>*]:flex-1">
        <DateRangeField
          departureDate={values.departureDate}
          returnDate={values.returnDate}
          isRoundTrip={values.isRoundTrip}
          onChangeDeparture={(value) => onChange("departureDate", value)}
          onChangeReturn={(value) => onChange("returnDate", value)}
          onToggleRoundTrip={(value) => onChange("isRoundTrip", value)}
          departureTimePreference={values.departureTimePreference}
          onChangeDepartureTimePreference={(value) => onChange("departureTimePreference", value)}
          error={errors?.departureDate || errors?.returnDate}
        />
      </div>

      <div className="hidden h-10 w-px shrink-0 self-center bg-navy-950/20 sm:block" />
      <div className="h-px w-full shrink-0 bg-slate-200 sm:hidden" />

      <div className="flex shrink-0 items-center px-6 py-6 sm:py-3">
        <PassengerStepper
          value={values.passengerCount}
          onChange={(value) => onChange("passengerCount", value)}
        />
      </div>

      {onSubmit ? (
        <div
          className={`flex shrink-0 items-center justify-center transition-colors duration-300 sm:py-0 ${
            isReady ? "sm:items-stretch sm:px-0" : "sm:pl-2 sm:pr-6"
          }`}
        >
          {/*
            Bare arrow, no button chrome, until the trip is fully filled
            in — matches the reference: a plain muted glyph sits flush
            inside the pill while incomplete. Once ready, it flips to a
            solid, full-bleed blue cap that fills the pill's trailing
            edge edge-to-edge — sm:self-stretch on the button (not just
            sm:items-stretch on its wrapper, which only affects layout,
            not the button's own cross-axis size) is what makes it reach
            the full height instead of just centering at a shorter
            content height. Rounded to match the container's own end
            curve via sm:rounded-r-full — since it self-stretches to the
            pill's exact height, rounded-full's radius (half the
            element's own height) comes out identical on both, so the
            corners line up without the container needing overflow-
            hidden — which would otherwise clip the From/To/Date
            dropdown menus that pop out below the pill.
            On the stacked mobile layout it's a full-width "NEXT" bar
            along the card's bottom edge (grey until the trip is
            complete, blue once ready), matching the mobile reference.
          */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !isReady}
            aria-label="Search"
            className={`flex shrink-0 items-center justify-center transition-colors duration-300 max-sm:h-11 max-sm:w-full max-sm:rounded-b-[23px] max-sm:text-xs max-sm:font-medium max-sm:uppercase max-sm:tracking-[0.2em] max-sm:text-white ${
              isReady
                ? "bg-blue-600 text-white hover:bg-blue-700 sm:h-auto sm:w-20 sm:self-stretch sm:rounded-r-full"
                : "pointer-events-none bg-slate-200 sm:h-10 sm:w-10 sm:rounded-full sm:bg-transparent sm:text-slate-300"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="hidden h-5 w-5 sm:block" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}