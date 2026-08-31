import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { createAvatarImageUploadSignature } from "@/lib/api/cloudinary";
import { handleApiError } from "@/lib/api/response";
import { checkRateLimit, checkUserRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";

// Any signed-in user can request a signature — this only unlocks
// uploading to *their own* per-user folder, not editing anyone else's
// avatar. requireAuth (not requireAdmin) is intentional here.
export async function POST(req: NextRequest) {
  try {
    const { clerkId } = await requireAuth();

    // Same two-limit shape as /api/upload/documents (FIX 5 there): a
    // per-user limit (can't be dodged by switching networks/devices)
    // plus a separate per-IP limit (can't be dodged by cycling many
    // accounts from one IP). This endpoint previously had neither,
    // unlike every other Cloudinary signature-issuance route.
    const userRate = checkUserRateLimit(clerkId, "upload:avatar", RATE_LIMITS.UPLOAD_SIGNATURE);
    if (!userRate.allowed) return rateLimitResponse(userRate);

    const ipRate = checkRateLimit(getRequestKey(req, "upload:avatar"), RATE_LIMITS.UPLOAD_SIGNATURE);
    if (!ipRate.allowed) return rateLimitResponse(ipRate);

    const signature = createAvatarImageUploadSignature(`true-north/avatars/${clerkId}`);
    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return handleApiError(error, "POST /api/upload/avatar");
  }
}