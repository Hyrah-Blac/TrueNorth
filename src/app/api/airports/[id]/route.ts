import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";
import { requireAdmin } from "@/middleware/admin";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { updateAirportSchema } from "@/features/airport/schemas/airport.schema";
import { NotFoundError } from "@/lib/errors/AppError";
import { OBJECT_ID_REGEX } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "airports:detail"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    await connectToDatabase();

    const filter = OBJECT_ID_REGEX.test(id) ? { _id: id } : { icao: id.toUpperCase() };
    const airport = await Airport.findOne(filter);
    if (!airport) throw new NotFoundError("Airport not found");

    return successResponse(airport);
  } catch (error) {
    return handleApiError(error, "GET /api/airports/[id]");
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateAirportSchema.parse(body);

    await connectToDatabase();

    const airport = await Airport.findById(id);
    if (!airport) throw new NotFoundError("Airport not found");

    Object.assign(airport, { ...data, iata: data.iata || undefined });
    await airport.save();

    return successResponse(airport);
  } catch (error) {
    return handleApiError(error, "PATCH /api/airports/[id]");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectToDatabase();

    const airport = await Airport.findByIdAndDelete(id);
    if (!airport) throw new NotFoundError("Airport not found");

    return successResponse({ id: String(airport._id), deleted: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/airports/[id]");
  }
}
