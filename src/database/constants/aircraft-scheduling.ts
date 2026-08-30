/**
 * ── AIRCRAFT SCHEDULING BUSINESS ASSUMPTIONS ───────────────────────────────
 *
 * Single, clearly-named home for the two time thresholds the shared
 * aircraft compatibility engine (features/booking/lib/aircraftAvailability.ts)
 * runs on. Pulled out into their own file — rather than left as
 * unexplained magic numbers inline in aircraftAvailability.ts — so
 * they read as a business configuration decision, not an
 * implementation detail, and so a future change only has to happen
 * in one place.
 *
 * WHY THESE EXIST AND WHY THEY'RE 90 MINUTES:
 * Neither the Aircraft nor Booking schema records an aircraft's
 * actual flight duration, cruise speed-derived leg time, or
 * turnaround/servicing time between flights. Determining true
 * schedule compatibility between two bookings on the same aircraft
 * would ordinarily need that data (e.g. "this aircraft takes 55
 * minutes Nairobi→Mombasa plus a 40-minute turnaround, so anything
 * ≥95 minutes apart on that route is provably safe"). Since that data
 * doesn't exist in the current data model, these two constants are a
 * deliberately simple, conservative stand-in:
 *
 *  - SHARED_FLIGHT_WINDOW_MINUTES — how close together two bookings'
 *    departure times on the SAME route have to be to be treated as
 *    the same physical flight (and therefore have their passenger
 *    counts combined against the aircraft's capacity).
 *  - MIN_TURNAROUND_MINUTES — the minimum gap between two bookings'
 *    departure times (regardless of route) required to treat them as
 *    safely sequential, independent uses of the same aircraft on the
 *    same day.
 *
 * Both currently default to 90 minutes. This is a business assumption,
 * not a measured aviation constant — see aircraftAvailability.ts's
 * module doc for exactly how each threshold is applied, and the
 * project's change report for the full rationale. Changing either
 * value changes ONLY how conservatively the platform reasons about
 * schedule compatibility; it does not change the underlying atomicity
 * guarantees (AircraftFlightManifest, AircraftDayLock) at all.
 *
 * NOT changed as part of the hardening pass that introduced this file
 * — the previous 90/90 defaults are preserved exactly.
 */
export const SHARED_FLIGHT_WINDOW_MINUTES = 90;
export const MIN_TURNAROUND_MINUTES = 90;
