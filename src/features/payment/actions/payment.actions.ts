"use server";

import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { initiatePaymentSchema, verifyPaymentSchema } from "../schemas/payment.schema";
import { initiateBookingPayment } from "../lib/initiatePayment";
import { applyMpesaResult } from "../lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { logger } from "@/lib/logging/logger";

export interface InitiatePaymentResult {
  success: boolean;
  checkoutRequestId?: string;
  customerMessage?: string;
  error?: string;
}

export async function initiatePayment(input: { bookingId: string; phoneNumber: string }): Promise<InitiatePaymentResult> {
  try {
    // getCurrentUserOrThrow (not requireAuth) so a deactivated account
    // can't push a real M-Pesa charge through — requireAuth only checks
    // that a Clerk session exists, not the app-level isActive flag an
    // admin sets via toggleUserActive. This is exactly the kind of
    // action that flag exists to block.
    const user = await getCurrentUserOrThrow();
    const data = initiatePaymentSchema.parse(input);

    const isAdmin = user.role === ROLES.ADMIN;

    const { stkResponse } = await initiateBookingPayment(
      data.bookingId,
      data.phoneNumber,
      String(user._id),
      isAdmin
    );

    return {
      success: true,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      customerMessage: stkResponse.CustomerMessage,
    };
  } catch (error) {
    logger.error("initiatePayment action failed", { error: String(error) });
    const message = error instanceof Error ? error.message : "Failed to start M-Pesa payment";
    return { success: false, error: message };
  }
}

export interface CheckPaymentStatusResult {
  status: string;
  paymentNumber?: string;
}

/** Polled by the client after initiatePayment while waiting for the customer to respond to the STK prompt. */
export async function checkPaymentStatus(checkoutRequestId: string): Promise<CheckPaymentStatusResult> {
  const user = await getCurrentUserOrThrow();
  const parsed = verifyPaymentSchema.parse({ checkoutRequestId });

  await connectToDatabase();

  const payment = await Payment.findOne({ "mpesa.checkoutRequestId": parsed.checkoutRequestId });
  if (!payment) return { status: "unknown" };

  if (user.role !== ROLES.ADMIN && String(payment.customer) !== String(user._id)) {
    return { status: "unknown" };
  }

  if (payment.status === PAYMENT_STATUSES.COMPLETED || payment.status === PAYMENT_STATUSES.FAILED) {
    return { status: payment.status, paymentNumber: payment.paymentNumber };
  }

  try {
    const queryResult = await queryStkPushStatus(parsed.checkoutRequestId);
    const resultCode = Number(queryResult.ResultCode);

    if (!Number.isNaN(resultCode) && resultCode !== 1032) {
      await applyMpesaResult(payment, { resultCode, resultDescription: queryResult.ResultDesc });
    }
  } catch (error) {
    logger.warn("checkPaymentStatus query failed, leaving payment pending", { error: String(error) });
  }

  return { status: payment.status, paymentNumber: payment.paymentNumber };
}