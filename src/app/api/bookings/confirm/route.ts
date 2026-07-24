import type { NextRequest } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/database/connection";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { successResponse, handleApiError } from "@/lib/api/response";
import { getBookingOrThrow, transitionBookingStatus } from "@/features/booking/lib/transitions";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { OBJECT_ID_REGEX } from "@/utils/validators";

const confirmBookingSchema = z.object({
  bookingId: z.string().regex(OBJECT_ID_REGEX, "Invalid booking ID"),
  note: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = confirmBookingSchema.parse(body);

    await connectToDatabase();

    const booking = await getBookingOrThrow(data.bookingId);
    const adminDbId = await resolveDbUserId(session.clerkId);

    const updated = await transitionBookingStatus(booking, BOOKING_STATUSES.CONFIRMED, {
      note: data.note ?? "Confirmed by admin",
      changedBy: adminDbId,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error, "POST /api/bookings/confirm");
  }
}
