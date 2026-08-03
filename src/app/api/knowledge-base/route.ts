import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import KnowledgeBase from "@/database/models/KnowledgeBase";
import { requireAdmin } from "@/middleware/admin";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { buildPaginatedResult } from "@/utils/pagination";
import { knowledgeBaseQuerySchema, createKnowledgeBaseSchema } from "@/features/knowledge-base/schemas/knowledge-base.schema";

export async function GET(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "kb:list"), RATE_LIMITS.PUBLIC_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const query = knowledgeBaseQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    await connectToDatabase();

    // Public endpoint only exposes published + public entries
    const filter: Record<string, unknown> = {
      status: "published",
      visibility: "public",
    };
    if (query.category) filter.category = query.category;
    if (query.search) filter.$text = { $search: query.search };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      KnowledgeBase.find(filter)
        .sort({ priority: -1, updatedAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .select("-content"),  // exclude heavy content from list view
      KnowledgeBase.countDocuments(filter),
    ]);

    return successResponse(buildPaginatedResult(items, total, query.page, query.limit));
  } catch (error) {
    return handleApiError(error, "GET /api/knowledge-base");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createKnowledgeBaseSchema.parse(body);

    await connectToDatabase();
    const entry = await KnowledgeBase.create({
      ...data,
      lastReviewedAt: data.lastReviewedAt ? new Date(data.lastReviewedAt) : undefined,
    });

    return successResponse(entry, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/knowledge-base");
  }
}
