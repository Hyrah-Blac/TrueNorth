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
 */
export async function transitionBookingStatus(
  booking: BookingDocument,
  nextStatus: BookingStatus,
  options: { note?: string; changedBy?: Types.ObjectId } = {}
): Promise<BookingDocument> {
  if (BOOKING_TERMINAL_STATUSES.includes(booking.status)) {
    throw new AppError(`Booking is already ${booking.status} and cannot be changed`, 409);
  }

  const allowed = ALLOWED_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Cannot move booking from "${booking.status}" to "${nextStatus}"`,
      409
    );
  }

  booking.status = nextStatus;
  booking.timeline.push({
    status: nextStatus,
    note: options.note,
    changedBy: options.changedBy,
    changedAt: new Date(),
  });

  if (nextStatus === BOOKING_STATUSES.CONFIRMED) booking.confirmedAt = new Date();
  if (nextStatus === BOOKING_STATUSES.COMPLETED) booking.completedAt = new Date();
  if (nextStatus === BOOKING_STATUSES.CANCELLED) booking.cancelledAt = new Date();

  await booking.save();

  if (nextStatus === BOOKING_STATUSES.CONFIRMED) {
    await notifyBookingConfirmed(booking);
  } else if (nextStatus === BOOKING_STATUSES.CANCELLED) {
    await notifyBookingCancelled(booking, options.note ?? booking.cancellationReason ?? "Not specified");
  }

  return booking;
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

export async function cancelBooking(
  booking: BookingDocument,
  reason: string,
  changedBy?: Types.ObjectId
): Promise<BookingDocument> {
  booking.cancellationReason = reason;
  booking.cancellationRequested = false;
  return transitionBookingStatus(booking, BOOKING_STATUSES.CANCELLED, {
    note: reason,
    changedBy,
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