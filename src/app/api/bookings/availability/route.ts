import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { availabilityQuerySchema } from "@/features/booking/schemas/booking.schema";
import { checkAircraftAvailability } from "@/features/booking/lib/transitions";

export async function GET(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "bookings:availability"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const query = availabilityQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    await connectToDatabase();

    const { available, conflicts } = await checkAircraftAvailability(
      query.aircraftId,
      query.departureDate,
      query.returnDate
    );

    return successResponse({
      available,
      conflictCount: conflicts.length,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/bookings/availability");
  }
}
