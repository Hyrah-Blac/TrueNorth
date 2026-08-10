"use server";

import { headers } from "next/headers";
import connectToDatabase from "@/database/connection";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { initiatePaymentSchema, verifyPaymentSchema } from "../schemas/payment.schema";
import { initiateBookingPayment } from "../lib/initiatePayment";
import { applyMpesaResult } from "../lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { checkRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
import { MPESA_SUCCESS, shouldTrustQueryFailure } from "@/lib/api/mpesaResultCodes";
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

  // Explicitly typed (rather than left to inference) because this variable
  // gets reassigned below from applyMpesaResult's return value — without
  // the explicit annotation, TS treats the HydratedDocument inferred from
  // findOne() as structurally distinct from the PaymentDocument type
  // applyMpesaResult declares, and the build fails on the reassignment.
  let payment: PaymentDocument | null = await Payment.findOne({
    "mpesa.checkoutRequestId": parsed.checkoutRequestId,
  });
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

    if (!Number.isNaN(resultCode)) {
      const isSuccess = resultCode === MPESA_SUCCESS;

      // A success from Daraja is always trusted immediately. A failure
      // is only applied once the STK prompt would realistically have
      // been resolved (shouldTrustQueryFailure) — the Query API is
      // known to report failure-looking codes moments after the push
      // is sent, before the customer has even seen the prompt. Applying
      // those early is what caused "declined" to appear while the
      // customer was still entering their PIN, and — because a
      // premature FAILED used to be permanently terminal — it also
      // blocked the real success callback from ever landing.
      if (isSuccess || shouldTrustQueryFailure(payment.createdAt)) {
        payment = await applyMpesaResult(payment, { resultCode, resultDescription: queryResult.ResultDesc });
      } else {
        logger.info("M-Pesa query reported a failure inside the grace window — leaving payment pending", {
          checkoutRequestId: parsed.checkoutRequestId,
          resultCode,
        });
      }
    }
  } catch (error) {
    logger.warn("checkPaymentStatus query failed, leaving payment pending", { error: String(error) });
  }

  return { status: payment.status, paymentNumber: payment.paymentNumber };
}