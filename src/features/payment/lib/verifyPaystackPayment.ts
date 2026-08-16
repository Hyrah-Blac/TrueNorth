import "server-only";
import connectToDatabase from "@/database/connection";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import { verifyTransaction } from "@/lib/api/paystack";
import { applyPaystackResult } from "./applyPaystackResult";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

export interface PaystackStatusResult {
  status: string;
  paymentNumber?: string;
  paymentId?: string;
}

/**
 * Looks up a Payment by its Paystack reference and, if it isn't
 * already resolved, verifies it directly with Paystack and applies the
 * result. Shared by the post-checkout callback page and the customer/
 * admin "check status" actions — the browser redirect that lands the
 * customer back on our site is UX only and is never itself trusted as
 * proof of payment.
 */
export async function checkPaystackPaymentStatus(
  reference: string,
  requester: { dbUserId: string; isAdmin: boolean }
): Promise<PaystackStatusResult> {
  await connectToDatabase();

  let payment: PaymentDocument | null = await Payment.findOne({ "paystack.reference": reference });
  if (!payment) throw new NotFoundError("Payment not found");

  if (!requester.isAdmin && String(payment.customer) !== String(requester.dbUserId)) {
    throw new ForbiddenError("You do not have access to this payment");
  }

  if (payment.status === PAYMENT_STATUSES.COMPLETED || payment.status === PAYMENT_STATUSES.FAILED) {
    return { status: payment.status, paymentNumber: payment.paymentNumber, paymentId: String(payment._id) };
  }

  try {
    const verified = await verifyTransaction(reference);
    payment = await applyPaystackResult(payment, { verified });
  } catch (error) {
    logger.warn("Paystack status check failed, leaving payment pending", {
      reference,
      error: String(error),
    });
  }

  return { status: payment.status, paymentNumber: payment.paymentNumber, paymentId: String(payment._id) };
}
