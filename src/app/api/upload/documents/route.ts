import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createQuoteAttachmentUploadSignature } from "@/lib/api/cloudinary";
import { handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse } from "@/middleware/rate-limit";
import { auditLog } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  try {
    // Require a signed-in user. Anyone submitting a quote must have an
    // account — handing out Cloudinary upload credentials to anonymous
    // visitors enables storage/bandwidth exhaustion with no recourse.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Sign in to attach documents" }, { status: 401 });
    }

    // Still rate-limit per user (not just IP) to prevent a single
    // account from hammering this on multiple tabs/devices.
    const rate = checkRateLimit(getRequestKey(req, `upload:documents:${userId}`), {
      windowMs: 60_000,
      max: 5,
    });
    if (!rate.allowed) return rateLimitResponse(rate);

    const signature = createQuoteAttachmentUploadSignature("true-north/quote-attachments");

    auditLog({
      action: "upload.document_signature",
      actorClerkId: userId,
      resourceType: "upload_signature",
    });

    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return handleApiError(error, "POST /api/upload/documents");
  }
}