import { NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { createAvatarImageUploadSignature } from "@/lib/api/cloudinary";
import { handleApiError } from "@/lib/api/response";

// Any signed-in user can request a signature — this only unlocks
// uploading to *their own* per-user folder, not editing anyone else's
// avatar. requireAuth (not requireAdmin) is intentional here.
export async function POST() {
  try {
    const { clerkId } = await requireAuth();
    const signature = createAvatarImageUploadSignature(`true-north/avatars/${clerkId}`);
    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return handleApiError(error, "POST /api/upload/avatar");
  }
}