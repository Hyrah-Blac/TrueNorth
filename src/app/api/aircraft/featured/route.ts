import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { AIRCRAFT_STATUSES } from "@/database/constants/aircraft";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "aircraft:featured"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    await connectToDatabase();

    const aircraft = await Aircraft.find({
      isFeatured: true,
      status: AIRCRAFT_STATUSES.ACTIVE,
    })
      .sort({ createdAt: -1 })
      .limit(6);

    return successResponse(aircraft);
  } catch (error) {
    return handleApiError(error, "GET /api/aircraft/featured");
  }
}
