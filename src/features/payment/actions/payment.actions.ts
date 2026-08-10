"use server";

import { headers } from "next/headers";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { initiatePaymentSchema, verifyPaymentSchema } from "../schemas/payment.schema";
import { initiateBookingPayment } from "../lib/initiatePayment";
import { applyMpesaResult } from "../lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { checkRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
import { isFinalMpesaResult } from "@/lib/api/mpesaResultCodes";
import { logger } from "@/lib/logging/logger";

/** Extracts the caller IP from Next.js server action request headers. */
async function getCallerIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

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

    // Rate-limit at the server action layer (mirrors the API route limit)
    // so the protection holds regardless of which call path is used.
    const ip = await getCallerIp();
    const rate = checkRateLimit(`payments:initiate:${ip}`, RATE_LIMITS.AUTHENTICATED_WRITE);
    if (!rate.allowed) {
      return { success: false, error: "Too many payment attempts. Please wait a moment and try again." };
    }

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

  // This action is polled on a ~3.5 s interval by MpesaButton. Without
  // a rate limit each poll triggers a Daraja API call, making it a free
  // amplification vector. AUTHENTICATED_READ (120/min) is generous
  // enough for normal polling (≈17 calls/min) while blocking abuse.
  const ip = await getCallerIp();
  const rate = checkRateLimit(`payments:status:${ip}`, RATE_LIMITS.AUTHENTICATED_READ);
  if (!rate.allowed) {
    // Return "unknown" rather than throwing — the client treats this as
    // "keep waiting" and retries on the next poll cycle, which is the
    // correct behavior when briefly rate-limited.
    return { status: "unknown" };
  }

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

    // Only apply the result when Daraja has returned a definitive outcome.
    // Codes in MPESA_PENDING_CODES (1032, 1037, 4001, …) mean the STK prompt
    // is still on-screen — the customer has not yet accepted or declined.
    // Treating those as failures is what causes "declined" to appear
    // immediately after the prompt arrives. Keep polling until we get
    // a final code (0 = success, anything else not in the pending set = failure).
    if (!Number.isNaN(resultCode) && isFinalMpesaResult(resultCode)) {
      await applyMpesaResult(payment, { resultCode, resultDescription: queryResult.ResultDesc });
    }
  } catch (error) {
    logger.warn("checkPaymentStatus query failed, leaving payment pending", { error: String(error) });
  }

  return { status: payment.status, paymentNumber: payment.paymentNumber };
}