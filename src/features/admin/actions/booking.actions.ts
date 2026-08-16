"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { auditLog } from "@/lib/security/audit";
import { getBookingOrThrow, transitionBookingStatus, cancelBooking } from "@/features/booking/lib/transitions";
import {
  updateBookingTripDetailsSchema,
  type UpdateBookingTripDetailsInput,
} from "@/features/booking/schemas/booking.schema";
import type { BookingStatus } from "@/database/constants/booking-status";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function adminUpdateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  note?: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireAdmin();
    const adminDbId = await resolveDbUserId(session.clerkId);

    const booking = await getBookingOrThrow(bookingId);
    const previousStatus = booking.status;
    const updated = await transitionBookingStatus(booking, status, { note, changedBy: adminDbId });

    auditLog({
      action: "booking.status_change",
      actorClerkId: session.clerkId,
      resourceId: bookingId,
      resourceType: "booking",
      meta: { bookingNumber: updated.bookingNumber, from: previousStatus, to: updated.status, note },
    });

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);

    return { success: true, data: { status: updated.status } };
  } catch (error) {
    logger.error("adminUpdateBookingStatus failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update booking status" };
  }
}

/**
 * Sets or updates the day-of-travel logistics (departure time, FBO,
 * ground contact) ops fills in once known. Deliberately its own
 * action rather than folded into adminUpdateBookingStatus — this
 * isn't a status transition, has no timeline/email side effects of
 * its own, and can be edited repeatedly as details firm up.
 */
export async function adminUpdateBookingTripDetails(
  bookingId: string,
  input: UpdateBookingTripDetailsInput
): Promise<ActionResult<{ updated: true }>> {
  try {
    const session = await requireAdmin();
    const data = updateBookingTripDetailsSchema.parse(input);

    const booking = await getBookingOrThrow(bookingId);
    booking.departureTime = data.departureTime;
    booking.fboName = data.fboName;
    booking.fboAddress = data.fboAddress;
    booking.groundContactPhone = data.groundContactPhone;
    await booking.save();

    auditLog({
      action: "booking.trip_details_update",
      actorClerkId: session.clerkId,
      resourceId: bookingId,
      resourceType: "booking",
      meta: { bookingNumber: booking.bookingNumber },
    });

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);
    revalidatePath(`/dashboard/bookings/${bookingId}`);

    return { success: true, data: { updated: true } };
  } catch (error) {
    logger.error("adminUpdateBookingTripDetails failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update trip details" };
  }
}

export async function adminCancelBooking(
  bookingId: string,
  reason: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireAdmin();
    const adminDbId = await resolveDbUserId(session.clerkId);

    const booking = await getBookingOrThrow(bookingId);
    const previousStatus = booking.status;
    const updated = await cancelBooking(booking, reason, adminDbId);

    auditLog({
      action: "booking.cancel",
      actorClerkId: session.clerkId,
      resourceId: bookingId,
      resourceType: "booking",
      meta: { bookingNumber: updated.bookingNumber, from: previousStatus, reason },
    });

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);

    return { success: true, data: { status: updated.status } };
  } catch (error) {
    logger.error("adminCancelBooking failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to cancel booking" };
  }
}
