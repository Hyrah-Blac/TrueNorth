import "server-only";
import type { ClientSession, Types } from "mongoose";
import Booking, { type BookingDocument } from "@/database/models/Booking";
import Aircraft from "@/database/models/Aircraft";
import AircraftFlightManifest, {
  type AircraftFlightManifestDocument,
} from "@/database/models/AircraftFlightManifest";
import AircraftDayLock from "@/database/models/AircraftDayLock";
import Quote from "@/database/models/Quote";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { CHARTER_TYPES, type CharterType } from "@/database/constants/charter-type";
import { SHARED_FLIGHT_WINDOW_MINUTES, MIN_TURNAROUND_MINUTES } from "@/database/constants/aircraft-scheduling";
import { NotFoundError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

/**
 * ── SHARED AIRCRAFT COMPATIBILITY ENGINE ──────────────────────────────────
 *
 * This is the single place that decides whether an aircraft can accept
 * a given (route, date, time, passenger count, charter type) request.
 * Every caller — the admin's direct booking endpoint, the customer's
 * quote-acceptance flow, and the admin's quote-approval pre-check —
 * goes through canAircraftAcceptBooking() for the read-only check and
 * claimAircraftCapacity() for the atomic commit. The admin's
 * quote-approval step additionally calls findConflictingApprovedQuote()
 * below, since two competing quotes can both be "approved" before
 * either becomes a Booking, and canAircraftAcceptBooking alone can't
 * see that. Do not duplicate this logic elsewhere.
 *
 * ASSUMPTIONS (the schema has no flight-duration/turnaround field, so
 * these are the documented, conservative stand-ins the task allows for
 * when exact scheduling data isn't available — see
 * database/constants/aircraft-scheduling.ts, the single source of
 * truth for the two thresholds below):
 *
 *  - Two bookings on the same aircraft, same route, whose departure
 *    times fall within SHARED_FLIGHT_WINDOW_MINUTES of each other are
 *    treated as the SAME physical flight — their passenger counts are
 *    combined and must fit within the aircraft's capacity.
 *  - Two bookings whose departure times are known and at least
 *    MIN_TURNAROUND_MINUTES apart are treated as separate, SEQUENTIAL
 *    uses of the same aircraft on the same day — always allowed
 *    (neither shares capacity with the other), regardless of route.
 *  - Anything else — same/different route with a departure time gap
 *    too small to be either the same flight or safely sequential, OR
 *    a missing departure time on either side for a would-be different
 *    route — is treated as an unprovable/impossible overlap and
 *    rejected. A missing departure time on a matching route is instead
 *    treated as the conservative "same flight" case (this matches the
 *    platform's previous same-day blocking behaviour for bookings
 *    that don't yet have a time assigned).
 *
 * These thresholds are intentionally simple and documented in their
 * own file rather than a full aviation scheduling model — see the
 * change report for the reasoning.
 *
 * CONCURRENCY: two layers work together to make the final commit
 * race-safe, not just the read-only pre-check:
 *  1. AircraftDayLock (see acquireAircraftDayLocks below) serializes
 *     the "decide, then commit" sequence for a given aircraft+date —
 *     closes the cross-route conflict race (see claimAircraftCapacity).
 *  2. AircraftFlightManifest (its own model file) atomically claims
 *     passenger capacity within a specific shared-flight bucket via
 *     optimistic compare-and-swap — closes the capacity-overflow race.
 */
export { SHARED_FLIGHT_WINDOW_MINUTES, MIN_TURNAROUND_MINUTES };

/** Booking statuses that actively hold aircraft capacity. Cancelled/completed bookings never block or consume it (Test 7 / Test 8). */
const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "in_progress"] as const;

export type AircraftCompatibilityCode =
  | "AIRCRAFT_NOT_FOUND"
  | "AIRCRAFT_CAPACITY_EXCEEDED"
  | "AIRCRAFT_EXCLUSIVE_CONFLICT"
  | "AIRCRAFT_SCHEDULE_CONFLICT"
  | "AIRCRAFT_UNAVAILABLE";

export interface AircraftAvailabilityCheckInput {
  aircraftId: Types.ObjectId | string;
  origin: string;
  destination: string;
  departureDate: Date;
  departureTime?: string; // "HH:MM", optional
  returnDate?: Date;
  returnTime?: string;
  passengerCount: number;
  charterType: CharterType;
  /** Exclude this booking id from conflict checks — used when re-validating an existing booking. */
  bookingIdToExclude?: Types.ObjectId | string;
}

export interface AircraftAvailabilityResult {
  allowed: boolean;
  code?: AircraftCompatibilityCode;
  reason?: string;
  /** Other active bookings this request would share a flight with, if any. */
  sharedWithBookingIds?: string[];
}

interface Leg {
  origin: string;
  destination: string;
  dateKey: string;
  time?: string; // "HH:MM"
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function dateKeyOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Minutes since midnight for a "HH:MM" string, or null if absent/invalid. */
function minutesOf(time?: string): number | null {
  if (!time) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

type LegRelationship = "same_flight" | "sequential" | "conflict";

/**
 * Classifies how two legs on the same aircraft, same calendar date,
 * relate to each other. See the module-level assumptions above.
 */
function classifyLegs(a: Leg, b: Leg): LegRelationship {
  const sameRoute = a.origin === b.origin && a.destination === b.destination;
  const minutesA = minutesOf(a.time);
  const minutesB = minutesOf(b.time);

  if (minutesA === null || minutesB === null) {
    // Not enough information to prove separation. Same route: fall
    // back to the conservative "same flight" bucket (combine/capacity
    // check, at minimum no worse than the old always-block behaviour).
    // Different route: cannot prove the aircraft can do both, so reject.
    return sameRoute ? "same_flight" : "conflict";
  }

  const gap = Math.abs(minutesA - minutesB);

  if (sameRoute && gap <= SHARED_FLIGHT_WINDOW_MINUTES) return "same_flight";
  if (gap >= MIN_TURNAROUND_MINUTES) return "sequential";
  return "conflict";
}

/** The outbound leg, and (for round trips) the return leg, of a booking/quote-like input. */
function legsOf(input: {
  origin: string;
  destination: string;
  departureDate: Date;
  departureTime?: string;
  returnDate?: Date;
  returnTime?: string;
}): Leg[] {
  const legs: Leg[] = [
    {
      origin: normalizeCode(input.origin),
      destination: normalizeCode(input.destination),
      dateKey: dateKeyOf(input.departureDate),
      time: input.departureTime,
    },
  ];

  if (input.returnDate) {
    legs.push({
      // The return leg flies the reverse route.
      origin: normalizeCode(input.destination),
      destination: normalizeCode(input.origin),
      dateKey: dateKeyOf(input.returnDate),
      time: input.returnTime,
    });
  }

  return legs;
}

/**
 * Deterministic bucket key for the atomic capacity ledger — see
 * AircraftFlightManifest.ts. Two bookings land in the same bucket
 * (and therefore share capacity) only when their route and calendar
 * date match exactly and their departure times fall in the same
 * SHARED_FLIGHT_WINDOW_MINUTES-wide window (or neither has a time
 * set). This mirrors the "same_flight" branch of classifyLegs above.
 */
export function groupKeyFor(leg: Leg): string {
  const minutes = minutesOf(leg.time);
  const windowLabel = minutes === null ? "none" : String(Math.floor(minutes / SHARED_FLIGHT_WINDOW_MINUTES));
  return `${leg.origin}:${leg.destination}:${leg.dateKey}:${windowLabel}`;
}

interface ScheduleScanResult {
  /** Set when a genuine schedule conflict was found — caller should reject immediately. */
  conflict?: { code: AircraftCompatibilityCode; reason: string };
  /** Other active bookings the request would share a flight (same bucket) with. */
  sharedWith: Set<string>;
  sharedPassengerTotal: number;
}

/**
 * The pairwise leg-comparison scan shared by canAircraftAcceptBooking
 * (the read-only pre-check) and claimAircraftCapacity (the atomic
 * commit's own pre-claim conflict check — see acquireAircraftDayLocks
 * for why it needs to run its own copy of this scan rather than
 * trusting an earlier, non-transactional canAircraftAcceptBooking
 * call). Extracted into one function so the conflict-detection rules
 * can never drift between the two call sites.
 */
async function scanAircraftLegs(
  aircraftId: Types.ObjectId | string,
  newLegs: Leg[],
  newCharterType: CharterType,
  newPassengerCount: number,
  excludeId: string | undefined,
  session?: ClientSession
): Promise<ScheduleScanResult> {
  const candidateDateKeys = Array.from(new Set(newLegs.map((leg) => leg.dateKey)));

  const candidates = await Booking.find({
    aircraft: aircraftId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: [
      { departureDate: { $in: candidateDateKeys.map((k) => new Date(k)) } },
      { returnDate: { $in: candidateDateKeys.map((k) => new Date(k)) } },
    ],
  }).session(session ?? null);

  // Re-filter precisely by dateKey (the $in above is a coarse
  // pre-filter; departureDate/returnDate carry a time component we
  // don't want to accidentally exclude on).
  const relevantCandidates = candidates.filter((candidate) => {
    const candidateLegs = legsOf({
      origin: candidate.departureAirportCode,
      destination: candidate.destinationAirportCode,
      departureDate: candidate.departureDate,
      departureTime: candidate.departureTime,
      returnDate: candidate.returnDate,
      returnTime: undefined,
    });
    return candidateLegs.some((leg) => candidateDateKeys.includes(leg.dateKey));
  });

  const sharedWith = new Set<string>();
  let sharedPassengerTotal = newPassengerCount;

  for (const candidate of relevantCandidates) {
    const candidateLegs = legsOf({
      origin: candidate.departureAirportCode,
      destination: candidate.destinationAirportCode,
      departureDate: candidate.departureDate,
      departureTime: candidate.departureTime,
      returnDate: candidate.returnDate,
      returnTime: undefined,
    });

    for (const newLeg of newLegs) {
      for (const candidateLeg of candidateLegs) {
        if (newLeg.dateKey !== candidateLeg.dateKey) continue;

        const relationship = classifyLegs(newLeg, candidateLeg);

        if (relationship === "conflict") {
          return {
            sharedWith,
            sharedPassengerTotal,
            conflict: {
              code: "AIRCRAFT_SCHEDULE_CONFLICT",
              reason: `Aircraft is already assigned to booking ${candidate.bookingNumber} on ${candidateLeg.dateKey}, and the two flights cannot be confirmed as compatible (different or unconfirmed routes/times).`,
            },
          };
        }

        if (relationship === "same_flight") {
          const candidateCharterType: CharterType = candidate.charterType ?? CHARTER_TYPES.EXCLUSIVE;

          if (newCharterType === CHARTER_TYPES.EXCLUSIVE || candidateCharterType === CHARTER_TYPES.EXCLUSIVE) {
            return {
              sharedWith,
              sharedPassengerTotal,
              conflict: {
                code: "AIRCRAFT_EXCLUSIVE_CONFLICT",
                reason: `Aircraft is already assigned to booking ${candidate.bookingNumber} on ${candidateLeg.dateKey} as an exclusive/private charter and cannot be shared.`,
              },
            };
          }

          sharedWith.add(String(candidate._id));
          sharedPassengerTotal += candidate.passengerCount;
        }
        // "sequential": no interaction — both allowed independently.
      }
    }
  }

  return { sharedWith, sharedPassengerTotal };
}

/**
 * Read-only compatibility check — used both as an early UX pre-check
 * (e.g. when an admin assigns an aircraft at quote-approval time) and
 * as the pre-flight validation immediately before the atomic commit.
 * This function alone does NOT protect against races between two
 * concurrent callers — see claimAircraftCapacity for the atomic half.
 */
export async function canAircraftAcceptBooking(
  input: AircraftAvailabilityCheckInput,
  session?: ClientSession
): Promise<AircraftAvailabilityResult> {
  const aircraft = await Aircraft.findById(input.aircraftId).session(session ?? null);
  if (!aircraft) {
    return { allowed: false, code: "AIRCRAFT_NOT_FOUND", reason: "Selected aircraft not found" };
  }

  const newLegs = legsOf(input);
  const excludeId = input.bookingIdToExclude ? String(input.bookingIdToExclude) : undefined;

  const scan = await scanAircraftLegs(input.aircraftId, newLegs, input.charterType, input.passengerCount, excludeId, session);

  if (scan.conflict) {
    return { allowed: false, code: scan.conflict.code, reason: scan.conflict.reason };
  }

  if (scan.sharedWith.size > 0 && scan.sharedPassengerTotal > aircraft.passengerCapacity) {
    return {
      allowed: false,
      code: "AIRCRAFT_CAPACITY_EXCEEDED",
      reason: `Combined passenger count (${scan.sharedPassengerTotal}) would exceed this aircraft's capacity (${aircraft.passengerCapacity}).`,
    };
  }

  return { allowed: true, sharedWithBookingIds: Array.from(scan.sharedWith) };
}

/**
 * Read-only pre-check used ONLY at quote-approval time (see
 * approveQuoteById) to catch an admin assigning the same aircraft, for
 * an overlapping/incompatible slot, to two different quotes that are
 * both still awaiting the customer's decision. Neither quote has
 * become a Booking yet, so canAircraftAcceptBooking above (which only
 * looks at the Booking collection) cannot see this — a quote is not
 * reserved capacity, just a priced proposal sitting in front of a
 * customer. Without this check, two customers can each be sent a
 * valid-looking "approved" quote for the same exclusive aircraft slot,
 * and only the first to accept actually gets it — the second hits a
 * confusing failure with no warning, at the worst possible moment
 * (right as they try to pay).
 *
 * This is UX-only, same caveat as canAircraftAcceptBooking: it doesn't
 * run inside a transaction and can still race against another admin
 * approving a conflicting quote seconds later. The real, race-safe
 * guarantee remains claimAircraftCapacity at acceptance time — this
 * just shrinks the window in which the bad state can be created in the
 * first place. It only flags hard conflicts (unprovable/incompatible
 * overlap, or either side being exclusive) rather than attempting the
 * full shared-capacity math scanAircraftLegs does for real bookings:
 * a quote can still be declined or left to expire without ever
 * consuming actual capacity, so summing passenger counts across two
 * merely-shared, not-yet-accepted quotes would produce false positives.
 */
export async function findConflictingApprovedQuote(
  input: AircraftAvailabilityCheckInput & { quoteIdToExclude?: Types.ObjectId | string }
): Promise<AircraftAvailabilityResult> {
  const newLegs = legsOf(input);
  const candidateDateKeys = Array.from(new Set(newLegs.map((leg) => leg.dateKey)));
  const excludeId = input.quoteIdToExclude ? String(input.quoteIdToExclude) : undefined;

  const candidates = await Quote.find({
    selectedAircraft: input.aircraftId,
    status: QUOTE_STATUSES.APPROVED,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: [
      { departureDate: { $in: candidateDateKeys.map((k) => new Date(k)) } },
      { returnDate: { $in: candidateDateKeys.map((k) => new Date(k)) } },
    ],
  });

  for (const candidate of candidates) {
    const candidateLegs = legsOf({
      origin: candidate.departureAirportCode,
      destination: candidate.destinationAirportCode,
      departureDate: candidate.departureDate,
      departureTime: candidate.departureTime,
      returnDate: candidate.returnDate,
      returnTime: undefined,
    });

    for (const newLeg of newLegs) {
      for (const candidateLeg of candidateLegs) {
        if (newLeg.dateKey !== candidateLeg.dateKey) continue;

        const relationship = classifyLegs(newLeg, candidateLeg);
        if (relationship === "sequential") continue; // both allowed independently

        const candidateCharterType: CharterType = candidate.charterType ?? CHARTER_TYPES.EXCLUSIVE;
        const isExclusiveOverlap =
          input.charterType === CHARTER_TYPES.EXCLUSIVE || candidateCharterType === CHARTER_TYPES.EXCLUSIVE;

        if (relationship === "conflict" || isExclusiveOverlap) {
          return {
            allowed: false,
            code: relationship === "conflict" ? "AIRCRAFT_SCHEDULE_CONFLICT" : "AIRCRAFT_EXCLUSIVE_CONFLICT",
            reason: `This aircraft is already assigned to another approved quote (${candidate.quoteNumber}) still awaiting a customer decision, for ${candidateLeg.dateKey}, and the two cannot both be honoured. Choose a different aircraft, adjust the time, or resolve the other quote first.`,
          };
        }
        // Both shared and same route/window, neither exclusive: no
        // hard conflict — leave the capacity trade-off to acceptance
        // time, per the note above.
      }
    }
  }

  return { allowed: true };
}

export interface ClaimAircraftCapacityInput extends AircraftAvailabilityCheckInput {
  bookingId: Types.ObjectId | string;
}

export interface ClaimAircraftCapacityResult {
  claimed: boolean;
  code?: AircraftCompatibilityCode;
  reason?: string;
  manifestIds?: string[];
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

/**
 * Acquires (creating if needed) the AircraftDayLock document for each
 * given (aircraft, dateKey) pair, in a fixed sort order — see
 * AircraftDayLock.ts for exactly why writing to these documents
 * inside the caller's transaction is what serializes concurrent
 * scheduling decisions. Sorted ascending by dateKey so two
 * transactions that both need locks on the same two dates (e.g. a
 * round trip spanning both) always acquire them in the same order,
 * avoiding a deadlock where each holds one lock the other needs.
 */
async function acquireAircraftDayLocks(
  aircraftId: Types.ObjectId | string,
  dateKeys: string[],
  session: ClientSession
): Promise<void> {
  const sortedUnique = Array.from(new Set(dateKeys)).sort();

  for (const dateKey of sortedUnique) {
    await AircraftDayLock.findOneAndUpdate(
      { aircraft: aircraftId, dateKey },
      { $inc: { touchCount: 1 }, $set: { lockedAt: new Date() } },
      { upsert: true, session }
    );
  }
}

/**
 * Atomically claims aircraft capacity for a booking that is about to
 * be committed. MUST be called inside the same Mongo session/
 * transaction as the Booking insert it belongs to (see acceptQuote.ts
 * and app/api/bookings/route.ts), and only after
 * canAircraftAcceptBooking has already returned `allowed: true`
 * within that same transaction (typically as an earlier, UX-only
 * pre-check).
 *
 * HARDENING — this function used to only re-derive the per-bucket
 * capacity claim and trusted the earlier canAircraftAcceptBooking call
 * for cross-route conflict detection. That earlier call is not
 * guaranteed to still be accurate by the time this function runs — in
 * particular, two concurrent transactions could both call
 * canAircraftAcceptBooking, both see "no conflict" against each
 * other's not-yet-committed booking, and both then reach this
 * function believing they're clear (the "cross-route concurrency gap"
 * from the change report). This function closes that gap in two
 * steps, both required together:
 *
 *  1. acquireAircraftDayLocks() — writes to a lock document per
 *     (aircraft, date) touched by this booking, inside the current
 *     transaction. If another transaction is concurrently doing the
 *     same for an overlapping date, one of the two blocks here until
 *     the other fully commits or aborts (see AircraftDayLock.ts).
 *  2. Once past the lock, this function re-runs the SAME conflict
 *     scan canAircraftAcceptBooking uses (scanAircraftLegs) itself,
 *     using the current transaction's session — so by construction it
 *     is now reading a state that already reflects anything the
 *     other, now-finished transaction committed. If a genuine
 *     conflict is found at this point, the claim is rejected before
 *     any AircraftFlightManifest bucket is touched.
 *
 * For each leg of the booking that survives the conflict re-scan,
 * this then claims (or creates) the corresponding
 * AircraftFlightManifest bucket via an optimistic compare-and-swap:
 * read the bucket's current totalPassengers, then write only if it is
 * still exactly what was just read. If another concurrent transaction
 * claimed capacity in the same bucket between the read and the write,
 * the conditional write matches nothing, and this function retries by
 * re-reading. Because the surrounding transaction (session.withTransaction
 * in acceptQuoteById) already retries its whole callback on a MongoDB
 * TransientTransactionError, a genuine same-bucket race between two
 * different transactions results in one of them being retried from the
 * top with fresh data — never both applying against stale totals. This
 * is what makes the "two concurrent requests, only one may win"
 * requirement hold for shared-capacity bookings (see the change report).
 *
 * Exclusive bookings behave the same way, just with the bucket's
 * capacity effectively fixed to the exclusive booking's own passenger
 * count — a second claim against the same bucket always fails since
 * the existing manifest's charterType won't match "shared", or (if
 * both sides claim "exclusive") the bucket already exists once the
 * first claim lands.
 */
export async function claimAircraftCapacity(
  input: ClaimAircraftCapacityInput,
  session: ClientSession
): Promise<ClaimAircraftCapacityResult> {
  const aircraft = await Aircraft.findById(input.aircraftId).session(session);
  if (!aircraft) {
    return { claimed: false, code: "AIRCRAFT_NOT_FOUND", reason: "Selected aircraft not found" };
  }

  const legs = legsOf(input);

  // Step 1: serialize against any other transaction deciding this
  // aircraft's schedule for the same date(s) — see acquireAircraftDayLocks.
  await acquireAircraftDayLocks(
    input.aircraftId,
    legs.map((leg) => leg.dateKey),
    session
  );

  // Step 2: now that we're guaranteed not to be racing another
  // transaction for this aircraft/date, re-run the conflict scan
  // against the current (now up-to-date) committed state.
  const excludeId = input.bookingIdToExclude ? String(input.bookingIdToExclude) : undefined;
  const scan = await scanAircraftLegs(input.aircraftId, legs, input.charterType, input.passengerCount, excludeId, session);

  if (scan.conflict) {
    return { claimed: false, code: scan.conflict.code, reason: scan.conflict.reason };
  }

  // Step 3: claim capacity per flight bucket, exactly as before.
  const manifestIds: string[] = [];

  for (const leg of legs) {
    const groupKey = groupKeyFor(leg);
    const claimed = await claimManifestBucket(
      {
        aircraftId: input.aircraftId,
        groupKey,
        departureAirportCode: leg.origin,
        destinationAirportCode: leg.destination,
        flightDateKey: leg.dateKey,
        charterType: input.charterType,
        capacity: input.charterType === CHARTER_TYPES.EXCLUSIVE ? input.passengerCount : aircraft.passengerCapacity,
        passengerCount: input.passengerCount,
        bookingId: input.bookingId,
      },
      session
    );

    if (!claimed.claimed) {
      // Roll back any earlier legs already claimed in this call before
      // reporting failure — the caller's surrounding transaction will
      // also abort, but this keeps the ledger consistent even if it
      // didn't (e.g. a future caller outside a transaction).
      for (const manifestId of manifestIds) {
        await releaseManifestBucketById(manifestId, input.bookingId, session).catch(() => undefined);
      }
      return { claimed: false, code: claimed.code, reason: claimed.reason };
    }

    manifestIds.push(claimed.manifestId!);
  }

  return { claimed: true, manifestIds };
}

interface ManifestClaimParams {
  aircraftId: Types.ObjectId | string;
  groupKey: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  flightDateKey: string;
  charterType: CharterType;
  capacity: number;
  passengerCount: number;
  bookingId: Types.ObjectId | string;
}

const MAX_CLAIM_ATTEMPTS = 6;

/**
 * SELF-HEALING FIX — AircraftFlightManifest is documented (see its
 * model file) as "a derived, best-effort ledger, NOT the source of
 * truth for a booking's existence," but claimManifestBucket never
 * actually re-verified that against the Booking collection before this
 * fix. A manifest bucket only ever gets cleared via
 * releaseAircraftCapacityForBooking, which runs exclusively on the
 * app's own cancel transition (transitions.ts). Any Booking removed by
 * another path — a direct DB delete, a database reset/reseed, a
 * migration, manual cleanup in Compass/mongosh — leaves its manifest
 * bucket behind as a ghost that still holds an "exclusive" or
 * capacity-consuming claim forever, with nothing left in the Booking
 * collection to release it. Every later claim against that exact
 * aircraft/route/date/time bucket then fails permanently, even with
 * zero real bookings anywhere in the database — indistinguishable from
 * a genuine conflict to anyone reading the error alone.
 *
 * Called every time an existing bucket is about to be trusted: checks
 * that every booking it references is still a real, active Booking
 * (ACTIVE_BOOKING_STATUSES — cancelled bookings are handled by the
 * normal release path and shouldn't be double-subtracted here). Stale
 * entries are pruned and totalPassengers recomputed from what's left;
 * if nothing real remains, the bucket itself is deleted so the caller
 * creates a fresh one from scratch. Returns null when the bucket was
 * deleted (caller should treat this exactly like "no bucket existed").
 */
async function reconcileManifestBucket(
  manifest: AircraftFlightManifestDocument,
  session: ClientSession
): Promise<AircraftFlightManifestDocument | null> {
  if (manifest.bookings.length === 0) return manifest;

  const liveBookings = await Booking.find({
    _id: { $in: manifest.bookings.map((entry) => entry.booking) },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  })
    .select("_id")
    .session(session);
  const liveIds = new Set(liveBookings.map((booking) => String(booking._id)));

  const staleEntries = manifest.bookings.filter((entry) => !liveIds.has(String(entry.booking)));
  if (staleEntries.length === 0) return manifest;

  logger.error("Orphaned AircraftFlightManifest booking reference(s) found — self-healing", {
    manifestId: String(manifest._id),
    aircraftId: String(manifest.aircraft),
    groupKey: manifest.groupKey,
    staleBookingIds: staleEntries.map((entry) => String(entry.booking)),
  });

  const remainingEntries = manifest.bookings.filter((entry) => liveIds.has(String(entry.booking)));

  if (remainingEntries.length === 0) {
    await AircraftFlightManifest.deleteOne({ _id: manifest._id }).session(session);
    return null;
  }

  const correctedTotal = remainingEntries.reduce((sum, entry) => sum + entry.passengerCount, 0);
  return AircraftFlightManifest.findOneAndUpdate(
    { _id: manifest._id },
    { $set: { bookings: remainingEntries, totalPassengers: correctedTotal } },
    { new: true, session }
  );
}

async function claimManifestBucket(
  params: ManifestClaimParams,
  session: ClientSession
): Promise<{ claimed: boolean; manifestId?: string; code?: AircraftCompatibilityCode; reason?: string }> {
  for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt += 1) {
    let existing = await AircraftFlightManifest.findOne({
      aircraft: params.aircraftId,
      groupKey: params.groupKey,
    }).session(session);

    if (existing) {
      existing = await reconcileManifestBucket(existing, session);
    }

    if (!existing) {
      try {
        const [created] = await AircraftFlightManifest.create(
          [
            {
              aircraft: params.aircraftId,
              groupKey: params.groupKey,
              departureAirportCode: params.departureAirportCode,
              destinationAirportCode: params.destinationAirportCode,
              flightDateKey: params.flightDateKey,
              charterType: params.charterType,
              capacity: params.capacity,
              totalPassengers: params.passengerCount,
              bookings: [{ booking: params.bookingId, passengerCount: params.passengerCount }],
            },
          ],
          { session }
        );
        return { claimed: true, manifestId: String(created._id) };
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          // Another concurrent claim created the bucket a moment ago —
          // loop and re-read it instead of failing outright.
          continue;
        }
        throw error;
      }
    }

    if (existing.charterType !== params.charterType || existing.charterType === CHARTER_TYPES.EXCLUSIVE) {
      return {
        claimed: false,
        code: "AIRCRAFT_EXCLUSIVE_CONFLICT",
        reason: "Aircraft is already committed to an incompatible (exclusive) flight assignment for this route/time.",
      };
    }

    const newTotal = existing.totalPassengers + params.passengerCount;
    if (newTotal > existing.capacity) {
      return {
        claimed: false,
        code: "AIRCRAFT_CAPACITY_EXCEEDED",
        reason: `Aircraft capacity exceeded: ${newTotal}/${existing.capacity} passengers for this flight.`,
      };
    }

    const updated = await AircraftFlightManifest.findOneAndUpdate(
      { _id: existing._id, totalPassengers: existing.totalPassengers },
      {
        $inc: { totalPassengers: params.passengerCount },
        $push: { bookings: { booking: params.bookingId, passengerCount: params.passengerCount } },
      },
      { new: true, session }
    );

    if (updated) {
      return { claimed: true, manifestId: String(updated._id) };
    }
    // Someone else updated the bucket between our read and write — retry.
  }

  logger.error("Aircraft capacity claim exhausted retries under contention", {
    aircraftId: String(params.aircraftId),
    groupKey: params.groupKey,
  });

  return {
    claimed: false,
    code: "AIRCRAFT_UNAVAILABLE",
    reason: "Could not confirm aircraft availability due to high demand for this flight. Please try again.",
  };
}

async function releaseManifestBucketById(
  manifestId: string,
  bookingId: Types.ObjectId | string,
  session?: ClientSession
): Promise<void> {
  const manifest = await AircraftFlightManifest.findById(manifestId).session(session ?? null);
  if (!manifest) return;

  const entry = manifest.bookings.find((candidate) => String(candidate.booking) === String(bookingId));
  if (!entry) return;

  // VERIFICATION FIX — this used to compute `remaining` (the array
  // with this booking's entry filtered out) from the stale read
  // above, then write it back with `$set: { bookings: remaining }`.
  // That is a lost-update race: claimManifestBucket adds a booking to
  // this same array via an atomic `$push` (see above), and if that
  // `$push` lands on the live document *after* this function's read
  // but *before* its `$set` write, the blind overwrite would silently
  // erase the concurrently-claimed entry — leaving totalPassengers
  // correct (it's incremented via a separate atomic `$inc`, unaffected
  // by the array overwrite) but the `bookings` array missing that
  // booking, so its eventual cancellation would find no matching entry
  // to release and permanently leak that capacity. `$pull` instead
  // operates directly against the document's live state at write time
  // — like the `$push` it needs to be safe against, it never depends
  // on a prior read to be correct.
  const updated = await AircraftFlightManifest.findOneAndUpdate(
    { _id: manifest._id },
    {
      $pull: { bookings: { booking: bookingId } },
      $inc: { totalPassengers: -entry.passengerCount },
    },
    { new: true, session: session ?? null }
  );

  if (updated && updated.bookings.length === 0) {
    // Only delete once the ACTUAL post-update state confirms the
    // bucket is empty — and re-check that condition again, live, at
    // delete time (via the `bookings: { $size: 0 }` filter) rather
    // than trusting the `updated` snapshot: a concurrent claim could
    // have landed in the gap between this findOneAndUpdate and the
    // deleteOne below. If it did, the filter simply won't match and
    // deleteOne becomes a safe no-op, leaving the now-reclaimed bucket
    // intact instead of deleting a document another transaction is
    // actively relying on.
    await AircraftFlightManifest.deleteOne({ _id: updated._id, bookings: { $size: 0 } }).session(session ?? null);
  }
}

/**
 * Releases whatever capacity a booking is holding across all of its
 * legs — called when a booking is cancelled so it stops blocking or
 * counting toward capacity for its former flight(s) (Test 7). Safe to
 * call even if the booking never actually claimed a manifest bucket
 * (e.g. it predates this feature, or was created outside this flow):
 * simply finds nothing to release and returns.
 *
 * Deliberately best-effort and non-throwing: the manifest ledger is a
 * derived structure, not the source of truth (the Booking's own
 * status is), so a failure here must never block or reverse a
 * booking-status transition that has already been committed.
 */
export async function releaseAircraftCapacityForBooking(booking: BookingDocument): Promise<void> {
  try {
    const manifests = await AircraftFlightManifest.find({ "bookings.booking": booking._id });
    for (const manifest of manifests) {
      await releaseManifestBucketById(String(manifest._id), booking._id);
    }
  } catch (error) {
    logger.error("Failed to release aircraft flight manifest capacity for cancelled booking", {
      bookingId: String(booking._id),
      error: String(error),
    });
  }
}

export async function assertAircraftExists(aircraftId: Types.ObjectId | string): Promise<void> {
  const exists = await Aircraft.exists({ _id: aircraftId });
  if (!exists) throw new NotFoundError("Selected aircraft not found");
}