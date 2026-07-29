import { NextResponse } from "next/server";
import { requireAdmin } from "@/middleware/admin";
import { createAircraftImageUploadSignature } from "@/lib/api/cloudinary";
import { handleApiError } from "@/lib/api/response";

export async function POST() {
  try {
    await requireAdmin();
    const signature = createAircraftImageUploadSignature("true-north/aircraft");
    return NextResponse.json({ success: true, data: signature });
  } catch (error) {
    return handleApiError(error, "POST /api/upload/aircraft");
  }
}