import type { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { initiatePaystackPaymentSchema } from "@/features/payment/schemas/payment.schema";
import { initiatePaystackBookingPayment } from "@/features/payment/lib/initiatePaystackPayment";

/**
 * POST /api/payments/paystack/initialize
 *
 * Starts a Paystack checkout for a booking's outstanding balance.
 * Mirrors POST /api/payments (the M-Pesa equivalent) — see that route
 * for the reasoning behind using getCurrentUserOrThrow rather than
 * requireAuth (blocks a deactivated account from pushing a real charge).
 *
 * The response only ever contains what the frontend needs to redirect
 * the customer to Paystack's hosted checkout — never the secret key or
 * internal booking/customer fields.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserOrThrow();

    const rate = checkRateLimit(getRequestKey(req, "payments:paystack:initialize"), RATE_LIMITS.AUTHENTICATED_WRITE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await req.json();
    const data = initiatePaystackPaymentSchema.parse(body);

    const isAdmin = user.role === ROLES.ADMIN;

    const { payment, authorizationUrl } = await initiatePaystackBookingPayment(
      data.bookingId,
      data.channel,
      String(user._id),
      isAdmin
    );

    return successResponse(
      {
        paymentId: payment._id,
        paymentNumber: payment.paymentNumber,
        status: payment.status,
        reference: payment.paystack.reference,
        authorizationUrl,
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/payments/paystack/initialize");
  }
}
