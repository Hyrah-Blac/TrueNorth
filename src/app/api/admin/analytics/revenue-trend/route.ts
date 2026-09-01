import type { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, handleApiError } from "@/lib/api/response";
import {
  checkRateLimit,
  getRequestKey,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/middleware/rate-limit";
import { requireAdmin } from "@/middleware/admin";
import { getRevenueTrend } from "@/features/admin/lib/getAnalytics";

const querySchema = z.object({
  range: z.enum(["daily", "monthly", "yearly"]).default("monthly"),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const rate = checkRateLimit(
      getRequestKey(req, "admin:analytics:revenue-trend"),
      RATE_LIMITS.AUTHENTICATED_READ
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const { range } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const data = await getRevenueTrend(range);

    return successResponse(data);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/analytics/revenue-trend");
  }
}
