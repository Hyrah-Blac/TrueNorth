import type { NextRequest } from "next/server";
import { requireAdmin } from "@/middleware/admin";
import { successResponse, handleApiError } from "@/lib/api/response";
import { approveQuoteSchema } from "@/features/quote/schemas/quote.schema";
import { approveQuoteById } from "@/features/quote/lib/approveQuote";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = approveQuoteSchema.parse(body);

    const { quote, booking } = await approveQuoteById(data, session.clerkId);

    return successResponse({ quote, booking });
  } catch (error) {
    return handleApiError(error, "POST /api/quotes/approve");
  }
}