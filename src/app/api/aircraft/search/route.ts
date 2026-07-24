import type { NextRequest } from "next/server";
import type { SortOrder } from "mongoose";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { AIRCRAFT_STATUSES } from "@/database/constants/aircraft";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { buildPaginatedResult } from "@/utils/pagination";
import { aircraftQuerySchema } from "@/features/aircraft/schemas/aircraft.schema";

export async function GET(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "aircraft:search"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const query = aircraftQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

    if (!query.search && !query.category && !query.mission && !query.minPassengers) {
      return successResponse(buildPaginatedResult([], 0, query.page, query.limit));
    }

    await connectToDatabase();

    const filter: Record<string, unknown> = { status: AIRCRAFT_STATUSES.ACTIVE };
    if (query.category) filter.category = query.category;
    if (query.minPassengers) filter.passengerCapacity = { $gte: query.minPassengers };
    if (query.mission) filter.recommendedMissions = query.mission;
    if (query.search) filter.$text = { $search: query.search };

    const skip = (query.page - 1) * query.limit;
    const projection = query.search ? { score: { $meta: "textScore" } } : undefined;
    const sort: Record<string, SortOrder | { $meta: string }> = query.search
      ? { score: { $meta: "textScore" } }
      : { isFeatured: -1, createdAt: -1 };

    const [items, total] = await Promise.all([
      Aircraft.find(filter, projection).sort(sort).skip(skip).limit(query.limit),
      Aircraft.countDocuments(filter),
    ]);

    return successResponse(buildPaginatedResult(items, total, query.page, query.limit));
  } catch (error) {
    return handleApiError(error, "GET /api/aircraft/search");
  }
}
