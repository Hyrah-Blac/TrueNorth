import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createQuoteAttachmentUploadSignature } from "@/lib/api/cloudinary";
import { handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Stricter than the general PUBLIC_WRITE limit: this endpoint hands
    // out a signed upload credential to anyone, signed in or not, so
    // it's the most attractive public target for abuse (storage/
    // bandwidth exhaustion) on the whole API surface.
    const rate = checkRateLimit(getRequestKey(req, "upload:documents"), {
      windowMs: 60_000,
      max: 3,
    });
    if (!rate.allowed) return rateLimitResponse(rate);

    const signature = createQuoteAttachmentUploadSignature("true-north/quote-attachments");
    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return handleApiError(error, "POST /api/upload/documents");
  }
}