import "server-only";
import type { Types } from "mongoose";
import Booking, { type BookingDocument } from "@/database/models/Booking";
import Aircraft from "@/database/models/Aircraft";
import User from "@/database/models/User";
import { BOOKING_STATUSES, BOOKING_TERMINAL_STATUSES, type BookingStatus } from "@/database/constants/booking-status";
import { AppError, NotFoundError } from "@/lib/errors/AppError";
import { sendEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import BookingConfirmation from "@/emails/BookingConfirmation";
import BookingCancelled from "@/emails/BookingCancelled";
import BookingCompleted from "@/emails/BookingCompleted";
import {
  canAircraftAcceptBooking,
  releaseAircraftCapacityForBooking,
  type AircraftAvailabilityResult,
} from "./aircraftAvailability";
import { CHARTER_TYPES } from "@/database/constants/charter-type";

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function getBookingOrThrow(bookingId: string): Promise<BookingDocument> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  return booking;
}

/**
 * Applies a status transition with validation and a timeline entry.
 * Used by the admin bookings dashboard and API today, and by the
 * M-Pesa callback (pending -> confirmed on successful payment) — keep
 * transition rules here, not duplicated per caller.
 *
 * A transition INTO "confirmed" additionally requires the booking's
 * balance to already be zero. This is the server-side half of the
 * charter business rule that a booking is only confirmed once payment
 * is complete — it must not be possible to talk a booking into
 * "confirmed" from the admin UI (or a direct API/server-action call)
 * while money is still owed, even though the generic pending->confirmed
 * transition is otherwise allowed by ALLOWED_TRANSITIONS below. The
 * automatic payment flow (applyMpesaResult) is unaffected by this: it
 * only ever calls this with "confirmed" after paidAmount has already
 * brought the balance to zero, so the guard is always already satisfied
 * on that path. It also doubles as a safe admin *recovery* path for the
 * rare case where a booking's balance reached zero but the automatic
 * confirmation step didn't complete (e.g. a transient failure inside
 * applyMpesaResult) — the balance check passes, so the transition is
 * still allowed there.
 *
 * The actual write is a single conditional findOneAndUpdate guarded on
 * the booking still being in the status it was read at (`fromStatus`),
 * the same atomic-guard shape as Step 1's acceptQuoteById/declineQuoteById.
 * That closes the race where two near-simultaneous requests (e.g. two
 * admins both clicking "Confirm") could otherwise both pass validation
 * against a stale in-memory read and both apply — only one wins here,
 * so only one notification ever fires.
 */
export async function transitionBookingStatus(
  booking: BookingDocument,
  nextStatus: BookingStatus,
  options: { note?: string; changedBy?: Types.ObjectId; extraSet?: Record<string, unknown> } = {}
): Promise<BookingDocument> {
  const fromStatus = booking.status;

  if (BOOKING_TERMINAL_STATUSES.includes(fromStatus)) {
    throw new AppError(`Booking is already ${fromStatus} and cannot be changed`, 409);
  }

  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`Cannot move booking from "${fromStatus}" to "${nextStatus}"`, 409);
  }

  if (nextStatus === BOOKING_STATUSES.CONFIRMED && booking.balanceAmount > 0) {
    throw new AppError(
      "This booking has an outstanding balance and cannot be confirmed until payment is complete.",
      409
    );
  }

  const timestampField =
    nextStatus === BOOKING_STATUSES.CONFIRMED
      ? "confirmedAt"
      : nextStatus === BOOKING_STATUSES.COMPLETED
        ? "completedAt"
        : nextStatus === BOOKING_STATUSES.CANCELLED
          ? "cancelledAt"
          : undefined;

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: fromStatus },
    {
      $set: {
        status: nextStatus,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
        ...options.extraSet,
      },
      $push: {
        timeline: { status: nextStatus, note: options.note, changedBy: options.changedBy, changedAt: new Date() },
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new AppError(
      "This booking's status changed before this update could be applied. Please refresh and try again.",
      409
    );
  }

  if (nextStatus === BOOKING_STATUSES.CONFIRMED) {
    await notifyBookingConfirmed(updated);
  } else if (nextStatus === BOOKING_STATUSES.CANCELLED) {
    // A cancelled booking must stop holding/consuming aircraft
    // capacity (Test 7 in the aircraft-assignment change report).
    // Best-effort and non-throwing — see releaseAircraftCapacityForBooking.
    await releaseAircraftCapacityForBooking(updated);
    await notifyBookingCancelled(updated, options.note ?? updated.cancellationReason ?? "Not specified");
  } else if (nextStatus === BOOKING_STATUSES.COMPLETED) {
    await notifyBookingCompleted(updated);
  }

  return updated;
}

async function notifyBookingConfirmed(booking: BookingDocument): Promise<void> {
  const [customer, aircraft] = await Promise.all([
    User.findById(booking.customer).select("firstName lastName email"),
    Aircraft.findById(booking.aircraft).select("name"),
  ]);

  if (!customer) return;

  const settings = await getSiteSettings();
  const airportNames = await getAirportNamesByCodes([booking.departureAirportCode, booking.destinationAirportCode]);

  await sendEmail({
    to: customer.email,
    subject: `Booking ${booking.bookingNumber} is confirmed`,
    react: BookingConfirmation({
      customerName: customer.firstName,
      bookingNumber: booking.bookingNumber,
      aircraftName: aircraft?.name ?? "Aircraft",
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      departureAirportName: airportNames[booking.departureAirportCode.toUpperCase()]?.city,
      destinationAirportName: airportNames[booking.destinationAirportCode.toUpperCase()]?.city,
      departureDate: formatDate(booking.departureDate),
      passengerCount: booking.passengerCount,
      totalAmount: formatCurrency(booking.totalAmount, booking.currency),
      dashboardUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
      contact: toEmailContact(settings),
    }),
  });
}

async function notifyBookingCancelled(booking: BookingDocument, reason: string): Promise<void> {
  const customer = await User.findById(booking.customer).select("firstName lastName email");
  if (!customer) return;

  const settings = await getSiteSettings();

  await sendEmail({
    to: customer.email,
    subject: `Booking ${booking.bookingNumber} has been cancelled`,
    react: BookingCancelled({
      customerName: customer.firstName,
      bookingNumber: booking.bookingNumber,
      cancellationReason: reason,
      contact: toEmailContact(settings),
    }),
  });
}

async function notifyBookingCompleted(booking: BookingDocument): Promise<void> {
  const [customer, aircraft] = await Promise.all([
    User.findById(booking.customer).select("firstName lastName email"),
    Aircraft.findById(booking.aircraft).select("name"),
  ]);

  if (!customer) return;

  const settings = await getSiteSettings();
  const airportNames = await getAirportNamesByCodes([booking.departureAirportCode, booking.destinationAirportCode]);

  await sendEmail({
    to: customer.email,
    subject: `Booking ${booking.bookingNumber} is complete`,
    react: BookingCompleted({
      customerName: customer.firstName,
      bookingNumber: booking.bookingNumber,
      aircraftName: aircraft?.name ?? "Aircraft",
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      departureAirportName: airportNames[booking.departureAirportCode.toUpperCase()]?.city,
      destinationAirportName: airportNames[booking.destinationAirportCode.toUpperCase()]?.city,
      dashboardUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
      contact: toEmailContact(settings),
    }),
  });
}

export async function cancelBooking(
  booking: BookingDocument,
  reason: string,
  changedBy?: Types.ObjectId
): Promise<BookingDocument> {
  return transitionBookingStatus(booking, BOOKING_STATUSES.CANCELLED, {
    note: reason,
    changedBy,
    extraSet: { cancellationReason: reason, cancellationRequested: false },
  });
}

/**
 * Checks whether an aircraft can accept a new booking for the given
 * route/dates/passenger count.
 *
 * IMPORTANT: this used to be a blanket "does any booking overlap this
 * date range" check, which incorrectly treated the whole aircraft as
 * unavailable for the entire day (or the entire outbound-to-return
 * window) any time it had another booking at all — which would have
 * made legitimate shared/pooled charters and same-day sequential
 * flights impossible. It now delegates to the shared compatibility
 * engine in aircraftAvailability.ts, which understands route
 * compatibility, departure-time proximity, passenger capacity, and
 * exclusive-vs-shared charter type. See that file for the full
 * rules, and FIX 1 in the change report for the rationale.
 *
 * This is a READ-ONLY pre-check, suitable for early UX validation
 * (e.g. before showing a form error). It is NOT sufficient on its own
 * to protect against a race between two concurrent booking attempts —
 * the actual commit must go through claimAircraftCapacity inside the
 * same transaction that creates the Booking. See acceptQuote.ts and
 * app/api/bookings/route.ts for the full flow.
 */
export async function checkAircraftAvailability(
  aircraftId: string,
  departureDate: Date,
  returnDate?: Date,
  options: {
    origin?: string;
    destination?: string;
    departureTime?: string;
    returnTime?: string;
    passengerCount?: number;
    charterType?: BookingDocument["charterType"];
    bookingIdToExclude?: string;
  } = {}
): Promise<{ available: boolean; result: AircraftAvailabilityResult }> {
  const result = await canAircraftAcceptBooking({
    aircraftId,
    origin: options.origin ?? "",
    destination: options.destination ?? "",
    departureDate,
    departureTime: options.departureTime,
    returnDate,
    returnTime: options.returnTime,
    passengerCount: options.passengerCount ?? 1,
    charterType: options.charterType ?? CHARTER_TYPES.EXCLUSIVE,
    bookingIdToExclude: options.bookingIdToExclude,
  });

  return { available: result.allowed, result };
}