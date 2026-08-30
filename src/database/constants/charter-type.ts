/**
 * Whether a booking's aircraft assignment may be combined with other
 * customers' bookings on the same flight, or must have the aircraft
 * to itself.
 *
 * EXCLUSIVE (the default — see Booking.ts) preserves the platform's
 * previous behaviour, where any two active bookings on the same
 * aircraft with overlapping dates were always treated as conflicting.
 * SHARED opts a specific booking into the pooled/shared-charter model
 * (see aircraftAvailability.ts) where multiple customers can occupy
 * the same flight as long as combined passenger count stays within
 * the aircraft's capacity.
 *
 * This is intentionally a new, minimal concept rather than reusing
 * missionType or any other existing field — nothing in the existing
 * schema already distinguishes "this customer gets the whole
 * aircraft" from "this customer is fine sharing it".
 */
export const CHARTER_TYPES = {
  EXCLUSIVE: "exclusive",
  SHARED: "shared",
} as const;

export type CharterType = (typeof CHARTER_TYPES)[keyof typeof CHARTER_TYPES];

export const CHARTER_TYPE_VALUES = Object.values(CHARTER_TYPES) as CharterType[];

export const CHARTER_TYPE_LABELS: Record<CharterType, string> = {
  exclusive: "Exclusive (private) charter",
  shared: "Shared / pooled charter",
};
