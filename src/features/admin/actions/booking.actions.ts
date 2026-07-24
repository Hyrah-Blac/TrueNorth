"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { getBookingOrThrow, transitionBookingStatus, cancelBooking } from "@/features/booking/lib/transitions";
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
    const updated = await transitionBookingStatus(booking, status, { note, changedBy: adminDbId });

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);

    return { success: true, data: { status: updated.status } };
  } catch (error) {
    logger.error("adminUpdateBookingStatus failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update booking status" };
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
    const updated = await cancelBooking(booking, reason, adminDbId);

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);

    return { success: true, data: { status: updated.status } };
  } catch (error) {
    logger.error("adminCancelBooking failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to cancel booking" };
  }
}
