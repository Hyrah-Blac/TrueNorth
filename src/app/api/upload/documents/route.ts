import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createQuoteAttachmentUploadSignature, quoteAttachmentFolderFor } from "@/lib/api/cloudinary";
import { handleApiError } from "@/lib/api/response";
import { checkRateLimit, checkUserRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
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

    // FIX 5: two independent limits, not one combined key. The
    // previous implementation folded the user id and the caller's IP
    // into a single discriminator (`upload:documents:${userId}` fed
    // through getRequestKey, which appends the IP) — meaning
    // "user123 from IP_A" and "user123 from IP_B" were different
    // buckets entirely, so a user could reset their limit just by
    // switching networks/devices (or spoofing X-Forwarded-For). A true
    // per-user limit has to be keyed on the user id ALONE.
    const userRate = checkUserRateLimit(userId, "upload:documents", RATE_LIMITS.UPLOAD_SIGNATURE);
    if (!userRate.allowed) return rateLimitResponse(userRate);

    // IP protection is kept as a genuinely separate limit (not removed,
    // per FIX 5) — still useful against e.g. one IP cycling through
    // many accounts to multiply its effective upload-signature budget.
    const ipRate = checkRateLimit(getRequestKey(req, "upload:documents"), RATE_LIMITS.UPLOAD_SIGNATURE);
    if (!ipRate.allowed) return rateLimitResponse(ipRate);

    // FIX 3: scoped to a per-user folder (not the previous shared
    // "true-north/quote-attachments" folder every user uploaded into)
    // so Cloudinary itself refuses to let this signature write outside
    // this user's own namespace — see createQuote.ts for the matching
    // ownership check at submission time.
    const signature = createQuoteAttachmentUploadSignature(quoteAttachmentFolderFor(userId));

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