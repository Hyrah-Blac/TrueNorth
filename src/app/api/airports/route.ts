import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";
import { requireAdmin } from "@/middleware/admin";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { buildPaginatedResult } from "@/utils/pagination";
import { airportQuerySchema, createAirportSchema } from "@/features/airport/schemas/airport.schema";

export async function GET(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "airports:list"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const query = airportQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    await connectToDatabase();

    const filter: Record<string, unknown> = { status: "active" };
    if (query.country) filter.country = query.country;
    if (query.runwaySurface) filter.runwaySurface = query.runwaySurface;
    if (query.fuelAvailable !== undefined) filter.fuelAvailable = query.fuelAvailable;
    if (query.nightOperations !== undefined) filter.nightOperations = query.nightOperations;
    if (query.customsAvailable !== undefined) filter.customsAvailable = query.customsAvailable;
    if (query.search) filter.$text = { $search: query.search };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Airport.find(filter).sort({ isFeatured: -1, name: 1 }).skip(skip).limit(query.limit),
      Airport.countDocuments(filter),
    ]);

    return successResponse(buildPaginatedResult(items, total, query.page, query.limit));
  } catch (error) {
    return handleApiError(error, "GET /api/airports");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createAirportSchema.parse(body);

    await connectToDatabase();
    const airport = await Airport.create({
      ...data,
      iata: data.iata || undefined,
    });

    return successResponse(airport, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/airports");
  }
}
