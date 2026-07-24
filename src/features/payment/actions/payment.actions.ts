"use server";

import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { requireAuth, resolveDbUserId } from "@/middleware/auth";
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
    const session = await requireAuth();
    const data = initiatePaymentSchema.parse(input);

    const requesterDbId = await resolveDbUserId(session.clerkId);
    const isAdmin = session.role === ROLES.ADMIN;

    const { stkResponse } = await initiateBookingPayment(
      data.bookingId,
      data.phoneNumber,
      String(requesterDbId),
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
  const session = await requireAuth();
  const parsed = verifyPaymentSchema.parse({ checkoutRequestId });

  await connectToDatabase();

  const payment = await Payment.findOne({ "mpesa.checkoutRequestId": parsed.checkoutRequestId });
  if (!payment) return { status: "unknown" };

  const requesterDbId = await resolveDbUserId(session.clerkId);
  if (session.role !== ROLES.ADMIN && String(payment.customer) !== String(requesterDbId)) {
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
