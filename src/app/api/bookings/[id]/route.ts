import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import { requireAuth, resolveDbUserId, getCurrentUserOrThrow } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/admin";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import {
  updateBookingStatusSchema,
  cancelBookingSchema,
  requestModificationSchema,
} from "@/features/booking/schemas/booking.schema";
import { transitionBookingStatus, cancelBooking } from "@/features/booking/lib/transitions";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await connectToDatabase();

    const booking = await Booking.findById(id).populate("aircraft").populate("quote");
    if (!booking) throw new NotFoundError("Booking not found");

    if (session.role !== ROLES.ADMIN) {
      const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
      if (String(booking.customer) !== String(dbUser?._id)) {
        throw new ForbiddenError("You do not have access to this booking");
      }
    }

    return successResponse(booking);
  } catch (error) {
    return handleApiError(error, "GET /api/bookings/[id]");
  }
}

/**
 * Admins can move a booking through any valid status transition
 * (confirm, start, complete, cancel). Customers can only request a
 * modification or cancellation — they cannot set status directly,
 * since that would let them mark their own booking "completed".
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const booking = await Booking.findById(id);
    if (!booking) throw new NotFoundError("Booking not found");

    if (session.role === ROLES.ADMIN) {
      if ("cancellationReason" in body) {
        const data = cancelBookingSchema.parse(body);
        const adminDbId = await resolveDbUserId(session.clerkId);
        const updated = await cancelBooking(booking, data.cancellationReason, adminDbId);
        return successResponse(updated);
      }

      const data = updateBookingStatusSchema.parse(body);
      const adminDbId = await resolveDbUserId(session.clerkId);
      const updated = await transitionBookingStatus(booking, data.status, {
        note: data.note,
        changedBy: adminDbId,
      });
      return successResponse(updated);
    }

    // Customer path: verify ownership, then allow only modification
    // requests or a cancellation request (still admin-actioned).
    // getCurrentUserOrThrow (not a bare User.findOne) so a deactivated
    // account can't cancel/modify bookings either — same isActive gate
    // as everywhere else this pattern appears.
    const dbUser = await getCurrentUserOrThrow();
    if (String(booking.customer) !== String(dbUser._id)) {
      throw new ForbiddenError("You do not have access to this booking");
    }

    if ("cancellationReason" in body) {
      const data = cancelBookingSchema.parse(body);
      const updated = await cancelBooking(booking, data.cancellationReason, dbUser._id);
      return successResponse(updated);
    }

    const data = requestModificationSchema.parse(body);
    booking.modificationRequested = true;
    booking.modificationNotes = data.modificationNotes;
    await booking.save();

    return successResponse(booking);
  } catch (error) {
    return handleApiError(error, "PATCH /api/bookings/[id]");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectToDatabase();

    const booking = await Booking.findById(id);
    if (!booking) throw new NotFoundError("Booking not found");

    await booking.softDelete();

    return successResponse({ id: booking._id, deleted: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/bookings/[id]");
  }
}