import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import User from "@/database/models/User";
import { requireAuth } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { verifyPaymentSchema } from "@/features/payment/schemas/payment.schema";
import { applyMpesaResult } from "@/features/payment/lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
import { MPESA_SUCCESS, shouldTrustQueryFailure } from "@/lib/api/mpesaResultCodes";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const data = verifyPaymentSchema.parse(body);

    await connectToDatabase();

    let payment = await Payment.findOne({ "mpesa.checkoutRequestId": data.checkoutRequestId });
    if (!payment) throw new NotFoundError("Payment not found");

    if (session.role !== ROLES.ADMIN) {
      const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
      if (String(payment.customer) !== String(dbUser?._id)) {
        throw new ForbiddenError("You do not have access to this payment");
      }
    }

    // Already resolved (by the webhook, most likely) — nothing to check.
    if (payment.status === PAYMENT_STATUSES.COMPLETED || payment.status === PAYMENT_STATUSES.FAILED) {
      return successResponse({ status: payment.status, paymentNumber: payment.paymentNumber });
    }

    // Still pending/processing: ask Daraja directly rather than making
    // the customer wait indefinitely for a callback that may be delayed.
    try {
      const queryResult = await queryStkPushStatus(data.checkoutRequestId);
      const resultCode = Number(queryResult.ResultCode);

      if (!Number.isNaN(resultCode)) {
        const isSuccess = resultCode === MPESA_SUCCESS;

        // Trust success immediately; only apply a failure once the STK
        // prompt would realistically have been resolved one way or
        // another — the Query API can report a failure-looking result
        // before the customer has actually responded.
        if (isSuccess || shouldTrustQueryFailure(payment.createdAt)) {
          payment = await applyMpesaResult(payment, {
            resultCode,
            resultDescription: queryResult.ResultDesc,
          });
        } else {
          logger.info("M-Pesa query reported a failure inside the grace window — leaving payment pending", {
            checkoutRequestId: data.checkoutRequestId,
            resultCode,
          });
        }
      }
    } catch (error) {
      logger.warn("M-Pesa status query failed, leaving payment pending", {
        checkoutRequestId: data.checkoutRequestId,
        error: String(error),
      });
    }

    return successResponse({ status: payment.status, paymentNumber: payment.paymentNumber });
  } catch (error) {
    return handleApiError(error, "POST /api/payments/verify");
  }
}