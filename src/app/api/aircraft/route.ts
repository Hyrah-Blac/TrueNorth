import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { buildPaginatedResult } from "@/utils/pagination";
import { aircraftQuerySchema, createAircraftSchema } from "@/features/aircraft/schemas/aircraft.schema";
import { AIRCRAFT_STATUSES } from "@/database/constants/aircraft";

export async function GET(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "aircraft:list"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const query = aircraftQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    await connectToDatabase();

    const filter: Record<string, unknown> = {
      status: AIRCRAFT_STATUSES.ACTIVE,
    };

    if (query.category) filter.category = query.category;
    if (query.minPassengers) filter.passengerCapacity = { $gte: query.minPassengers };
    if (query.mission) filter.recommendedMissions = query.mission;
    if (query.search) filter.$text = { $search: query.search };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Aircraft.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(query.limit),
      Aircraft.countDocuments(filter),
    ]);

    return successResponse(buildPaginatedResult(items, total, query.page, query.limit));
  } catch (error) {
    return handleApiError(error, "GET /api/aircraft");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = createAircraftSchema.parse(body);

    await connectToDatabase();
    const createdBy = await resolveDbUserId(session.clerkId);

    const aircraft = await Aircraft.create({ ...data, createdBy });

    return successResponse(aircraft, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/aircraft");
  }
}
