import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import User from "@/database/models/User";
import { requireAuth } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { buildPaginatedResult } from "@/utils/pagination";
import { createQuoteSchema, quoteQuerySchema } from "@/features/quote/schemas/quote.schema";
import { createQuoteFromInput } from "@/features/quote/lib/createQuote";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const query = quoteQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    if (session.role !== ROLES.ADMIN) {
      const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
      filter.customer = dbUser?._id ?? null;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Quote.find(filter)
        .populate("aircraftPreference", "name slug category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Quote.countDocuments(filter),
    ]);

    return successResponse(buildPaginatedResult(items, total, query.page, query.limit));
  } catch (error) {
    return handleApiError(error, "GET /api/quotes");
  }
}

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "quotes:create"), RATE_LIMITS.PUBLIC_WRITE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await req.json();
    const data = createQuoteSchema.parse(body);

    // Charter requests can be submitted signed-out (public form) or
    // signed-in (auto-attaches the customer for dashboard tracking).
    const { userId: clerkId } = await auth();
    const quote = await createQuoteFromInput(data, clerkId);

    return successResponse(quote, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/quotes");
  }
}
