import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { successResponse, handleApiError } from "@/lib/api/response";
import { rejectQuoteSchema } from "@/features/quote/schemas/quote.schema";
import { AppError, NotFoundError } from "@/lib/errors/AppError";
import { QUOTE_STATUSES, QUOTE_TERMINAL_STATUSES } from "@/database/constants/quote-status";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = rejectQuoteSchema.parse(body);

    await connectToDatabase();

    const quote = await Quote.findById(data.quoteId);
    if (!quote) throw new NotFoundError("Quote not found");

    if (QUOTE_TERMINAL_STATUSES.includes(quote.status)) {
      throw new AppError(`Quote is already ${quote.status} and cannot be rejected`, 409);
    }

    const adminDbId = await resolveDbUserId(session.clerkId);

    quote.status = QUOTE_STATUSES.REJECTED;
    quote.rejectionReason = data.rejectionReason;
    quote.reviewedBy = adminDbId;
    quote.reviewedAt = new Date();
    await quote.save();

    return successResponse(quote);
  } catch (error) {
    return handleApiError(error, "POST /api/quotes/reject");
  }
}
