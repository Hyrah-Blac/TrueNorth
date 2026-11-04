import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { requireAdmin } from "@/middleware/admin";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { updateAircraftSchema } from "@/features/aircraft/schemas/aircraft.schema";
import { OBJECT_ID_REGEX } from "@/utils/validators";
import { NotFoundError } from "@/lib/errors/AppError";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { PUBLIC_HIDDEN_AIRCRAFT_FIELDS } from "@/features/aircraft/lib/aircraftFieldVisibility";
import { ROLES } from "@/database/constants/roles";
import { AIRCRAFT_STATUSES } from "@/database/constants/aircraft";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function aircraftFilterFor(idOrSlug: string) {
  return OBJECT_ID_REGEX.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
}

async function findAircraftByIdOrSlug(idOrSlug: string) {
  return Aircraft.findOne(aircraftFilterFor(idOrSlug));
}

/**
 * True only for a signed-in admin. Checks userId first so anonymous
 * visitors don't trip getRoleFromSessionClaims' "claim missing"
 * misconfiguration warning.
 */
async function isAdminCaller(): Promise<boolean> {
  const { userId, sessionClaims } = await auth();
  return Boolean(userId) && getRoleFromSessionClaims(sessionClaims) === ROLES.ADMIN;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "aircraft:detail"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    await connectToDatabase();

    // This endpoint is public. Visitors only see ACTIVE aircraft (the list,
    // search and featured routes already enforce that) and never the
    // internal fields: createdBy is an admin's user id and aiNotes is
    // staff guidance for the concierge. Admins keep the full record.
    const admin = await isAdminCaller();
    const query = Aircraft.findOne(
      admin ? aircraftFilterFor(id) : { ...aircraftFilterFor(id), status: AIRCRAFT_STATUSES.ACTIVE }
    );
    if (!admin) query.select(PUBLIC_HIDDEN_AIRCRAFT_FIELDS);

    const aircraft = await query;
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
