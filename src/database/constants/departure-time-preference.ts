export const DEPARTURE_TIME_PREFERENCES = {
  ANY: "any",
  EARLY_MORNING: "early_morning",
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
  LATE_EVENING: "late_evening",
} as const;

export type DepartureTimePreference =
  (typeof DEPARTURE_TIME_PREFERENCES)[keyof typeof DEPARTURE_TIME_PREFERENCES];

export const DEPARTURE_TIME_PREFERENCE_VALUES = Object.values(
  DEPARTURE_TIME_PREFERENCES
) as DepartureTimePreference[];

export const DEPARTURE_TIME_PREFERENCE_LABELS: Record<DepartureTimePreference, string> = {
  any: "Any time",
  early_morning: "Early morning",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  late_evening: "Late evening",
};

// Indicative clock ranges shown next to each window in the picker —
// display only, not enforced. Kept alongside the labels so any screen
// that lists the presets (customer picker, admin quote detail) can
// show the same ranges without redefining them.
export const DEPARTURE_TIME_PREFERENCE_RANGES: Record<DepartureTimePreference, string> = {
  any: "",
  early_morning: "Before 8am",
  morning: "8am – 12pm",
  afternoon: "12 – 5pm",
  evening: "5 – 9pm",
  late_evening: "After 9pm",
};