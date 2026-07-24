import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createUploadSignature } from "@/lib/api/cloudinary";
import { handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(getRequestKey(req, "upload:documents"), RATE_LIMITS.PUBLIC_WRITE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const signature = createUploadSignature("true-north/quote-attachments");
    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return handleApiError(error, "POST /api/upload/documents");
  }
}
