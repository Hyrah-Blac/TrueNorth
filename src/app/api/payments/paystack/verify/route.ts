import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import User from "@/database/models/User";
import connectToDatabase from "@/database/connection";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { verifyPaystackPaymentSchema } from "@/features/payment/schemas/payment.schema";
import { checkPaystackPaymentStatus } from "@/features/payment/lib/verifyPaystackPayment";

/**
 * POST /api/payments/paystack/verify
 *
 * Re-checks a Paystack payment's authoritative status directly with
 * Paystack (never trusting whatever the browser redirect claimed).
 * Mirrors POST /api/payments/verify (the M-Pesa equivalent).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const rate = checkRateLimit(getRequestKey(req, "payments:paystack:verify"), RATE_LIMITS.AUTHENTICATED_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await req.json();
    const data = verifyPaystackPaymentSchema.parse(body);

    await connectToDatabase();
    const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
    const isAdmin = session.role === ROLES.ADMIN;

    const result = await checkPaystackPaymentStatus(data.reference, {
      dbUserId: String(dbUser?._id ?? ""),
      isAdmin,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "POST /api/payments/paystack/verify");
  }
}
