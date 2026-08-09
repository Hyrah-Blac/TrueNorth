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
import BookingConfirmation from "@/emails/BookingConfirmation";
import BookingCancelled from "@/emails/BookingCancelled";
import BookingCompleted from "@/emails/BookingCompleted";

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

  await sendEmail({
    to: customer.email,
    subject: `Booking ${booking.bookingNumber} is confirmed`,
    react: BookingConfirmation({
      customerName: customer.firstName,
      bookingNumber: booking.bookingNumber,
      aircraftName: aircraft?.name ?? "Aircraft",
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
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

  await sendEmail({
    to: customer.email,
    subject: `Booking ${booking.bookingNumber} is complete`,
    react: BookingCompleted({
      customerName: customer.firstName,
      bookingNumber: booking.bookingNumber,
      aircraftName: aircraft?.name ?? "Aircraft",
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
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
 * Checks whether an aircraft is free for the requested window. Two
 * bookings overlap when one's departure falls before the other's
 * return (or departure, for one-way trips) and vice versa — the
 * standard interval-overlap check. Only pending/confirmed/in_progress
 * bookings count as conflicts; cancelled/completed ones don't block.
 */
export async function checkAircraftAvailability(
  aircraftId: string,
  departureDate: Date,
  returnDate?: Date
): Promise<{ available: boolean; conflicts: BookingDocument[] }> {
  const windowEnd = returnDate ?? departureDate;

  const conflicts = await Booking.find({
    aircraft: aircraftId,
    status: { $in: ["pending", "confirmed", "in_progress"] },
    $expr: {
      $and: [
        { $lte: ["$departureDate", windowEnd] },
        { $gte: [{ $ifNull: ["$returnDate", "$departureDate"] }, departureDate] },
      ],
    },
  });

  return { available: conflicts.length === 0, conflicts };
}