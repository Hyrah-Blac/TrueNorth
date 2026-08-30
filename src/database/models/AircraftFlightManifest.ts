import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import { CHARTER_TYPE_VALUES, type CharterType } from "../constants/charter-type";

/**
 * The atomic capacity ledger behind the shared-aircraft booking rule
 * (see features/booking/lib/aircraftAvailability.ts).
 *
 * One document represents one "flight" a specific aircraft is
 * performing — a bucket of bookings sharing the same aircraft, route,
 * calendar date, and departure-time window (see groupKeyFor in
 * aircraftAvailability.ts for exactly how the bucket is computed).
 * Bookings on the same aircraft but a different route/date/time
 * window get their own, independent manifest document, so two
 * genuinely separate flights never contend for the same lock.
 *
 * This collection is a derived, best-effort ledger, NOT the source of
 * truth for a booking's existence — Booking documents remain that.
 * It exists purely so a single atomic conditional update
 * (findOneAndUpdate guarded on the previously-read totalPassengers,
 * i.e. optimistic concurrency / compare-and-swap) can serialize
 * concurrent capacity claims against the same flight, which is not
 * possible when capacity is instead computed by re-summing several
 * separate Booking documents on every request (see the "IMPORTANT
 * ATOMIC SHARED CAPACITY REQUIREMENT" scenario this closes).
 */
export interface AircraftFlightManifestBookingEntry {
  booking: Types.ObjectId;
  passengerCount: number;
}

export interface AircraftFlightManifestDocument extends Document {
  aircraft: Types.ObjectId;
  /** Deterministic bucket key — see groupKeyFor(). Unique per aircraft. */
  groupKey: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  /** yyyy-MM-dd, the calendar date (UTC) this flight bucket belongs to. */
  flightDateKey: string;
  charterType: CharterType;
  /** Aircraft's passengerCapacity for a shared bucket; the single booking's own passengerCount for an exclusive bucket. */
  capacity: number;
  totalPassengers: number;
  bookings: AircraftFlightManifestBookingEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const AircraftFlightManifestBookingEntrySchema = new Schema<AircraftFlightManifestBookingEntry>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    passengerCount: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AircraftFlightManifestSchema = new Schema<AircraftFlightManifestDocument>(
  {
    aircraft: { type: Schema.Types.ObjectId, ref: "Aircraft", required: true, index: true },
    groupKey: { type: String, required: true, trim: true },
    departureAirportCode: { type: String, required: true, trim: true, uppercase: true },
    destinationAirportCode: { type: String, required: true, trim: true, uppercase: true },
    flightDateKey: { type: String, required: true },
    charterType: { type: String, enum: CHARTER_TYPE_VALUES, required: true },
    capacity: { type: Number, required: true, min: 1 },
    totalPassengers: { type: Number, required: true, min: 0, default: 0 },
    bookings: { type: [AircraftFlightManifestBookingEntrySchema], default: [] },
  },
  { timestamps: true }
);

// The actual mutual-exclusion primitive: two documents can never exist
// for the same (aircraft, groupKey) pair, so the "does a bucket exist
// yet" create-race is resolved by Mongo itself (duplicate-key error),
// not by application-level locking.
AircraftFlightManifestSchema.index({ aircraft: 1, groupKey: 1 }, { unique: true });
AircraftFlightManifestSchema.index({ aircraft: 1, flightDateKey: 1 });

export const AircraftFlightManifest: Model<AircraftFlightManifestDocument> =
  models.AircraftFlightManifest ||
  model<AircraftFlightManifestDocument>("AircraftFlightManifest", AircraftFlightManifestSchema);

export default AircraftFlightManifest;
