import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import KnowledgeBase from "@/database/models/KnowledgeBase";
import { requireAdmin } from "@/middleware/admin";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { updateKnowledgeBaseSchema } from "@/features/knowledge-base/schemas/knowledge-base.schema";
import { NotFoundError } from "@/lib/errors/AppError";
import { OBJECT_ID_REGEX } from "@/utils/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "kb:detail"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    await connectToDatabase();

    const filter = OBJECT_ID_REGEX.test(id) ? { _id: id } : { slug: id };
    const entry = await KnowledgeBase.findOne({
      ...filter,
      status: "published",
      visibility: "public",
    });
    if (!entry) throw new NotFoundError("Knowledge base entry not found");

    return successResponse(entry);
  } catch (error) {
    return handleApiError(error, "GET /api/knowledge-base/[id]");
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateKnowledgeBaseSchema.parse(body);

    await connectToDatabase();

    const entry = await KnowledgeBase.findById(id);
    if (!entry) throw new NotFoundError("Entry not found");

    Object.assign(entry, {
      ...data,
      lastReviewedAt: data.lastReviewedAt ? new Date(data.lastReviewedAt) : entry.lastReviewedAt,
    });
    await entry.save();

    return successResponse(entry);
  } catch (error) {
    return handleApiError(error, "PATCH /api/knowledge-base/[id]");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectToDatabase();

    const entry = await KnowledgeBase.findByIdAndDelete(id);
    if (!entry) throw new NotFoundError("Entry not found");

    return successResponse({ id: String(entry._id), deleted: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/knowledge-base/[id]");
  }
}
