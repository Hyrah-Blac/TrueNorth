import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

/**
 * HARDENING — closes the cross-route concurrency gap the first
 * implementation pass explicitly deferred (see change report,
 * "Cross-route conflict detection under true concurrency").
 *
 * One document per (aircraft, calendar date). Its *contents* carry no
 * meaning at all — nothing reads touchCount or lockedAt to make a
 * decision. What matters is that writing to this document happens
 * inside the same Mongo transaction as the schedule-conflict scan and
 * capacity claim it protects (see acquireAircraftDayLocks and
 * claimAircraftCapacity in aircraftAvailability.ts).
 *
 * Two concurrent transactions that both touch the same aircraft/date
 * will have one of them block on this document's write until the
 * other transaction commits or aborts (standard MongoDB multi-document
 * transaction concurrency control — a transaction that writes a
 * document another open transaction has already written gets a
 * WriteConflict, surfaced to the driver as a TransientTransactionError,
 * which every caller here already retries via session.withTransaction).
 * By acquiring this lock BEFORE reading other bookings on the same
 * aircraft/date to check for conflicts, and not releasing it until the
 * whole transaction commits, the second transaction is guaranteed to
 * see the first transaction's fully-committed result once it's finally
 * unblocked — instead of both transactions independently reading a
 * stale "looks available" snapshot and both committing.
 *
 * Deliberately NOT the same collection as AircraftFlightManifest: the
 * manifest represents real capacity data (queried, displayed,
 * released on cancellation); this lock represents nothing but "someone
 * is currently deciding this aircraft's schedule for this date" and is
 * never read for its content, only written to for its side effect.
 * Kept forever once created (one row per aircraft/date ever booked) —
 * cheap, and there's no correct moment to delete it that wouldn't risk
 * removing the very serialization point a concurrent transaction is
 * about to depend on.
 */
export interface AircraftDayLockDocument extends Document {
  aircraft: Types.ObjectId;
  /** yyyy-MM-dd */
  dateKey: string;
  touchCount: number;
  lockedAt: Date;
}

const AircraftDayLockSchema = new Schema<AircraftDayLockDocument>({
  aircraft: { type: Schema.Types.ObjectId, ref: "Aircraft", required: true },
  dateKey: { type: String, required: true },
  touchCount: { type: Number, default: 0 },
  lockedAt: { type: Date, default: Date.now },
});

AircraftDayLockSchema.index({ aircraft: 1, dateKey: 1 }, { unique: true });

export const AircraftDayLock: Model<AircraftDayLockDocument> =
  models.AircraftDayLock || model<AircraftDayLockDocument>("AircraftDayLock", AircraftDayLockSchema);

export default AircraftDayLock;
