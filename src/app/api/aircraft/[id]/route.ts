import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { requireAdmin } from "@/middleware/admin";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { updateAircraftSchema } from "@/features/aircraft/schemas/aircraft.schema";
import { OBJECT_ID_REGEX } from "@/utils/validators";
import { NotFoundError } from "@/lib/errors/AppError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function findAircraftByIdOrSlug(idOrSlug: string) {
  const filter = OBJECT_ID_REGEX.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  return Aircraft.findOne(filter);
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "aircraft:detail"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    await connectToDatabase();

    const aircraft = await findAircraftByIdOrSlug(id);
    if (!aircraft) throw new NotFoundError("Aircraft not found");

    return successResponse(aircraft);
  } catch (error) {
    return handleApiError(error, "GET /api/aircraft/[id]");
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateAircraftSchema.parse(body);

    await connectToDatabase();

    const aircraft = await findAircraftByIdOrSlug(id);
    if (!aircraft) throw new NotFoundError("Aircraft not found");

    Object.assign(aircraft, data);
    await aircraft.save();

    return successResponse(aircraft);
  } catch (error) {
    return handleApiError(error, "PATCH /api/aircraft/[id]");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectToDatabase();

    const aircraft = await findAircraftByIdOrSlug(id);
    if (!aircraft) throw new NotFoundError("Aircraft not found");

    await aircraft.softDelete();

    return successResponse({ id: aircraft._id, deleted: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/aircraft/[id]");
  }
}
