"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { requireAdmin } from "@/middleware/admin";
import { applyMpesaResult } from "@/features/payment/lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { NotFoundError, AppError, isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function adminRecheckPayment(paymentId: string): Promise<ActionResult<{ status: string }>> {
  try {
    await requireAdmin();
    await connectToDatabase();

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError("Payment not found");

    if (!payment.mpesa.checkoutRequestId) {
      throw new AppError("This payment has no M-Pesa checkout request to verify", 409);
    }

    if (payment.status === PAYMENT_STATUSES.COMPLETED || payment.status === PAYMENT_STATUSES.FAILED) {
      return { success: true, data: { status: payment.status } };
    }

    const queryResult = await queryStkPushStatus(payment.mpesa.checkoutRequestId);
    const resultCode = Number(queryResult.ResultCode);

    if (!Number.isNaN(resultCode) && resultCode !== 1032) {
      await applyMpesaResult(payment, { resultCode, resultDescription: queryResult.ResultDesc });
    }

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/payments/${paymentId}`);

    return { success: true, data: { status: payment.status } };
  } catch (error) {
    logger.error("adminRecheckPayment failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to check payment status" };
  }
}
