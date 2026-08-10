"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import { requireAdmin } from "@/middleware/admin";
import { applyMpesaResult } from "@/features/payment/lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
import { MPESA_SUCCESS, shouldTrustQueryFailure } from "@/lib/api/mpesaResultCodes";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { NotFoundError, AppError, isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function adminRecheckPayment(paymentId: string): Promise<ActionResult<{ status: string }>> {
  try {
    await requireAdmin();
    await connectToDatabase();

    // Explicitly typed — same reason as in the customer-facing status
    // checks: this variable is reassigned below from applyMpesaResult's
    // return value, and without the annotation TS can't unify the
    // inferred HydratedDocument from findById() with PaymentDocument.
    let payment: PaymentDocument | null = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError("Payment not found");

    if (!payment.mpesa.checkoutRequestId) {
      throw new AppError("This payment has no M-Pesa checkout request to verify", 409);
    }

    if (payment.status === PAYMENT_STATUSES.COMPLETED || payment.status === PAYMENT_STATUSES.FAILED) {
      return { success: true, data: { status: payment.status } };
    }

    const queryResult = await queryStkPushStatus(payment.mpesa.checkoutRequestId);
    const resultCode = Number(queryResult.ResultCode);

    if (!Number.isNaN(resultCode)) {
      const isSuccess = resultCode === MPESA_SUCCESS;

      // Same rule as the customer-facing check: trust success immediately,
      // but don't let a possibly-premature failure from the query overwrite
      // a payment whose STK prompt might still be live (e.g. an admin
      // clicking "recheck" moments after the customer was pushed the
      // prompt).
      if (isSuccess || shouldTrustQueryFailure(payment.createdAt)) {
        payment = await applyMpesaResult(payment, { resultCode, resultDescription: queryResult.ResultDesc });
      } else {
        logger.info("Admin recheck: M-Pesa query reported a failure inside the grace window — leaving pending", {
          paymentId,
          resultCode,
        });
      }
    }

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/payments/${paymentId}`);

    return { success: true, data: { status: payment.status } };
  } catch (error) {
    logger.error("adminRecheckPayment failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to check payment status" };
  }
}