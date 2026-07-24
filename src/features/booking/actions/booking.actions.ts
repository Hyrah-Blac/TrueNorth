"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { cancelBooking } from "../lib/transitions";
import { ForbiddenError, NotFoundError, isAppError } from "@/lib/errors/AppError";
import { cancelBookingSchema, requestModificationSchema } from "../schemas/booking.schema";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function requestBookingCancellation(
  bookingId: string,
  input: { cancellationReason: string }
): Promise<ActionResult<{ status: string }>> {
  try {
    const user = await getCurrentUserOrThrow();
    const data = cancelBookingSchema.parse(input);

    await connectToDatabase();

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (String(booking.customer) !== String(user._id)) {
      throw new ForbiddenError("You do not have access to this booking");
    }

    const updated = await cancelBooking(booking, data.cancellationReason, user._id);
    revalidatePath(`/dashboard/bookings/${bookingId}`);

    return { success: true, data: { status: updated.status } };
  } catch (error) {
    const message = isAppError(error) ? error.message : "Failed to cancel booking";
    return { success: false, error: message };
  }
}

export async function requestBookingModification(
  bookingId: string,
  input: { modificationNotes: string }
): Promise<ActionResult<{ modificationRequested: boolean }>> {
  try {
    const user = await getCurrentUserOrThrow();
    const data = requestModificationSchema.parse(input);

    await connectToDatabase();

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (String(booking.customer) !== String(user._id)) {
      throw new ForbiddenError("You do not have access to this booking");
    }

    booking.modificationRequested = true;
    booking.modificationNotes = data.modificationNotes;
    await booking.save();

    revalidatePath(`/dashboard/bookings/${bookingId}`);
    return { success: true, data: { modificationRequested: true } };
  } catch (error) {
    const message = isAppError(error) ? error.message : "Failed to request modification";
    return { success: false, error: message };
  }
}
