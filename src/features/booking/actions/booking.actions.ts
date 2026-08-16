"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { ForbiddenError, NotFoundError, AppError, isAppError } from "@/lib/errors/AppError";
import { cancelBookingSchema, requestModificationSchema } from "../schemas/booking.schema";
import { sendEmail, getAdminNotificationEmail } from "@/lib/api/resend";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import AdminCancellationRequested from "@/emails/AdminCancellationRequested";
import CancellationRequestReceived from "@/emails/CancellationRequestReceived";
import ModificationRequestReceived from "@/emails/ModificationRequestReceived";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Flags the booking for cancellation and notifies ops — it does NOT
 * cancel the booking itself. A charter booking can have payments,
 * scheduling, and refund implications, so the actual cancellation
 * (see adminCancelBooking) stays a staff-reviewed action, the same way
 * a modification request is a flag for the team to follow up on
 * rather than something the customer can push through directly.
 */
export async function requestBookingCancellation(
  bookingId: string,
  input: { cancellationReason: string }
): Promise<ActionResult<{ cancellationRequested: boolean }>> {
  try {
    const user = await getCurrentUserOrThrow();
    const data = cancelBookingSchema.parse(input);

    await connectToDatabase();

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (String(booking.customer) !== String(user._id)) {
      throw new ForbiddenError("You do not have access to this booking");
    }
    if (booking.cancellationRequested) {
      throw new AppError("A cancellation request is already pending for this booking", 409);
    }

    booking.cancellationRequested = true;
    booking.cancellationReason = data.cancellationReason;
    await booking.save();

    revalidatePath(`/dashboard/bookings/${bookingId}`);

    const settings = await getSiteSettings();
    const contact = toEmailContact(settings);

    await sendEmail({
      to: getAdminNotificationEmail(),
      subject: `Cancellation requested: ${booking.bookingNumber}`,
      react: AdminCancellationRequested({
        bookingNumber: booking.bookingNumber,
        customerName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
        reason: data.cancellationReason,
        adminUrl: `${siteConfig.url}/admin/bookings/${booking._id}`,
        contact,
      }),
    });

    // Best-effort receipt so the customer has confirmation their request
    // landed, without implying the booking is cancelled yet — the actual
    // cancellation (and its own BookingCancelled email) only happens once
    // staff acts on this, via cancelBooking in transitions.ts.
    await sendEmail({
      to: user.email,
      subject: `We've received your cancellation request — ${booking.bookingNumber}`,
      react: CancellationRequestReceived({
        customerName: user.firstName || user.email,
        bookingNumber: booking.bookingNumber,
        reason: data.cancellationReason,
        dashboardUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
        contact,
      }),
    });

    return { success: true, data: { cancellationRequested: true } };
  } catch (error) {
    const message = isAppError(error) ? error.message : "Failed to request cancellation";
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

    // Best-effort receipt so the customer has confirmation their request
    // landed, without implying anything has changed yet — same shape as
    // the cancellation-request receipt above.
    const settings = await getSiteSettings();
    await sendEmail({
      to: user.email,
      subject: `We've received your change request — ${booking.bookingNumber}`,
      react: ModificationRequestReceived({
        customerName: user.firstName || user.email,
        bookingNumber: booking.bookingNumber,
        notes: data.modificationNotes,
        dashboardUrl: `${siteConfig.url}/dashboard/bookings/${bookingId}`,
        contact: toEmailContact(settings),
      }),
    });

    return { success: true, data: { modificationRequested: true } };
  } catch (error) {
    const message = isAppError(error) ? error.message : "Failed to request modification";
    return { success: false, error: message };
  }
}
