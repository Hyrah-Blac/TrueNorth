"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import {
  DEPARTURE_TIME_PREFERENCE_VALUES,
  DEPARTURE_TIME_PREFERENCE_LABELS,
  type DepartureTimePreference,
} from "@/database/constants/departure-time-preference";
import { LOCAL_TIME_REGEX } from "@/utils/validators";

const SET_TIME_OPTION = "set_time";

interface DateRangeFieldProps {
  departureDate: string;
  returnDate?: string;
  isRoundTrip: boolean;
  onChangeDeparture: (value: string) => void;
  onChangeReturn: (value: string) => void;
  onToggleRoundTrip: (value: boolean) => void;
  // Either one of DEPARTURE_TIME_PREFERENCE_VALUES ("morning", "evening",
  // ...) or an exact "HH:MM" time when the customer used "Set time".
  departureTimePreference?: string;
  onChangeDepartureTimePreference: (value: string | undefined) => void;
  error?: string;
}

/**
 * "Date · Add return" pill segment. Renders a native date input directly
 * inline (like PassengerStepper's always-visible +/- controls) rather
 * than behind a click-to-open popover — clicking it opens the browser's
 * own date picker immediately, in one step, instead of opening a custom
 * panel that just repeated the "Departure date" / "Add return" labels
 * already implied by the collapsed pill text. Labeled simply "Date" for
 * accessibility. The native calendar-picker-indicator icon is made
 * invisible and stretched to cover the full input so the entire field —
 * not just a small icon — is the click target that opens the date
 * picker; the CalendarBlank glyph beside it is decorative. Native date
 * inputs render their own locale placeholder ("mm/dd/yyyy") that can't
 * be overridden via a placeholder attribute, so when empty the input's
 * text is made transparent and an opaque white "Date" label is overlaid
 * across the full input (not just left-aligned) to fully mask the
 * native placeholder — some browsers don't fully respect a transparent
 * color on the native date segments, so a same-width opaque cover is
 * needed rather than relying on the color trick alone. The overlay is
 * pointer-events-none so clicks still reach the input underneath and
 * open the picker. The overlay hides and the native segments become
 * visible as soon as the input is focused, so it never sits on top of
 * the segment the browser highlights while editing. Each date field's
 * text turns blue on hover (the "Date" placeholder and the native
 * mm/dd/yyyy segments alike) to signal it's clickable.
 *
 * "Add return" is a plain text toggle next to the date input — no
 * checkbox glyph, matching the reference, which renders it as bare
 * clickable label text. Clicking it reveals a second native date input
 * for the return date in the same row.
 *
 * A departure time preference sits right after the departure date as a
 * native <select> — "Departing any time" (unset) plus broad windows
 * (Early morning / Morning / Afternoon / Evening / Late evening), and a
 * "Set time" option that swaps in a native <input type="time"> for an
 * exact time. This is a preference the customer states up front, not a
 * confirmed time — ops assigns the actual departure time later, at
 * quote approval.
 */
export function DateRangeField({
  departureDate,
  returnDate,
  isRoundTrip,
  onChangeDeparture,
  onChangeReturn,
  onToggleRoundTrip,
  departureTimePreference,
  onChangeDepartureTimePreference,
  error,
}: DateRangeFieldProps) {
  const today = new Date().toISOString().slice(0, 10);

  const isExactTime = Boolean(departureTimePreference && LOCAL_TIME_REGEX.test(departureTimePreference));
  const selectValue = isExactTime ? SET_TIME_OPTION : departureTimePreference || "any";

  function handleTimeSelectChange(value: string) {
    if (value === SET_TIME_OPTION) {
      // Default to a sensible starting time so the native time input
      // doesn't open empty; the customer can still change it freely.
      onChangeDepartureTimePreference("09:00");
      return;
    }
    onChangeDepartureTimePreference(value === "any" ? undefined : value);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <CalendarBlank className="h-5 w-5 shrink-0 text-navy-900" aria-hidden="true" />

        <div className="relative shrink-0">
          <input
            type="date"
            aria-label="Date"
            min={today}
            value={departureDate ?? ""}
            onChange={(event) => onChangeDeparture(event.target.value)}
            className={`peer relative min-w-0 cursor-pointer bg-transparent text-sm outline-none transition-colors [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 hover:text-blue-600 focus:text-navy-900 sm:text-base ${
              departureDate ? "text-navy-900" : "text-transparent"
            }`}
          />
          {!departureDate ? (
            <span className="pointer-events-none absolute inset-0 flex items-center bg-white text-sm text-navy-900 transition-colors peer-hover:text-blue-600 peer-focus:hidden sm:text-base">
              Date
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-x-2">
          <select
            aria-label="Departure time"
            value={selectValue}
            onChange={(event) => handleTimeSelectChange(event.target.value)}
            className={`cursor-pointer rounded-md bg-transparent text-sm outline-none transition-colors hover:text-blue-600 focus:text-navy-900 sm:text-base ${
              selectValue === "any" ? "text-slate-500" : "text-navy-900"
            }`}
          >
            <option value="any">Departing any time</option>
            {DEPARTURE_TIME_PREFERENCE_VALUES.filter((value) => value !== "any").map((value) => (
              <option key={value} value={value}>
                {DEPARTURE_TIME_PREFERENCE_LABELS[value as DepartureTimePreference]}
              </option>
            ))}
            <option value={SET_TIME_OPTION}>Set time</option>
          </select>

          {isExactTime ? (
            <input
              type="time"
              aria-label="Exact departure time"
              value={departureTimePreference}
              onChange={(event) => onChangeDepartureTimePreference(event.target.value || "09:00")}
              className="cursor-pointer bg-transparent text-sm text-navy-900 outline-none [color-scheme:light] sm:text-base"
            />
          ) : null}
        </div>

        <button
          type="button"
          role="checkbox"
          aria-checked={isRoundTrip}
          onClick={() => onToggleRoundTrip(!isRoundTrip)}
          className={`shrink-0 whitespace-nowrap text-sm transition-colors hover:text-blue-600 sm:text-base ${
            isRoundTrip ? "text-navy-900" : "text-slate-500"
          }`}
        >
          Add return
        </button>

        {isRoundTrip ? (
          <div className="relative shrink-0">
            <input
              type="date"
              aria-label="Return date"
              min={departureDate || today}
              value={returnDate ?? ""}
              onChange={(event) => onChangeReturn(event.target.value)}
              className={`peer relative min-w-0 cursor-pointer bg-transparent text-sm outline-none transition-colors [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 hover:text-blue-600 focus:text-navy-900 sm:text-base ${
                returnDate ? "text-navy-900" : "text-transparent"
              }`}
            />
            {!returnDate ? (
              <span className="pointer-events-none absolute inset-0 flex items-center bg-white text-sm text-navy-900 transition-colors peer-hover:text-blue-600 peer-focus:hidden sm:text-base">
                Date
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}