import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before populate runs

import User from "@/database/models/User";
import { requireAuth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/admin";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { updateQuoteNotesSchema } from "@/features/quote/schemas/quote.schema";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await connectToDatabase();

    const quote = await Quote.findById(id).populate("aircraftPreference", "name slug category");
    if (!quote) throw new NotFoundError("Quote not found");

    if (session.role !== ROLES.ADMIN) {
      const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
      if (!quote.customer || String(quote.customer) !== String(dbUser?._id)) {
        throw new ForbiddenError("You do not have access to this quote");
      }
    }

    return successResponse(quote);
  } catch (error) {
    return handleApiError(error, "GET /api/quotes/[id]");
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateQuoteNotesSchema.parse(body);

    await connectToDatabase();

    const quote = await Quote.findById(id);
    if (!quote) throw new NotFoundError("Quote not found");

    if (data.adminNotes !== undefined) quote.adminNotes = data.adminNotes;
    await quote.save();

    return successResponse(quote);
  } catch (error) {
    return handleApiError(error, "PATCH /api/quotes/[id]");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectToDatabase();

    const quote = await Quote.findById(id);
    if (!quote) throw new NotFoundError("Quote not found");

    await quote.softDelete();

    return successResponse({ id: quote._id, deleted: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/quotes/[id]");
  }
}
