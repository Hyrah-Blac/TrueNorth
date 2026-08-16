import "server-only";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { logger } from "@/lib/logging/logger";
import { creditBookingAndNotify } from "./creditBookingForPayment";
import { notifyPaymentFailed } from "./notifyPaymentFailed";
import type { PaystackVerifyData } from "@/lib/api/paystack";

export interface PaystackResultData {
  /** Always the output of a server-side verifyTransaction() call — never trust a webhook/redirect body directly. */
  verified: PaystackVerifyData;
}

/**
 * Paystack transaction statuses that unambiguously mean the payment did
 * NOT go through. Anything outside this set and outside "success" —
 * most notably "pending" (or "ongoing"/"queued", which Paystack also
 * uses) — means the transaction is still in flight and must NOT be
 * treated as a failure. This matters specifically for mobile money
 * (M-Pesa): the customer may still be entering their PIN on their
 * phone when the callback page loads and calls verify — that's a
 * "pending" state, not a failure, and marking it FAILED prematurely
 * would incorrectly close out a payment the customer is actively completing.
 */
const RESOLVED_FAILURE_STATUSES = new Set(["failed", "abandoned", "reversed"]);

/** Whether a Paystack transaction status is final (success or an unambiguous failure) rather than still in flight (e.g. "pending"). */
export function isResolvedPaystackStatus(status: string): boolean {
  return status === "success" || RESOLVED_FAILURE_STATUSES.has(status);
}

/**
 * Applies a Paystack-verified transaction result to the matching
 * Payment, and confirms the linked Booking once the result is a
 * success. Mirrors applyMpesaResult's idempotency shape exactly — see
 * that file for the detailed rationale; the short version:
 *
 * - A Payment already COMPLETED is returned unchanged (never re-applied).
 * - FAILED is terminal EXCEPT it can still be upgraded to COMPLETED —
 *   Paystack's own transaction state is authoritative and final once
 *   `success`, so if a stray "abandoned" webhook lands before the real
 *   "success" one, a later verified success must still be able to land.
 * - A verified status that is neither a success nor an unambiguous
 *   failure (see RESOLVED_FAILURE_STATUSES above) leaves the payment
 *   untouched — there is nothing yet to apply.
 * - The actual double-apply guard is the conditional findOneAndUpdate:
 *   only the caller that wins the atomic claim proceeds to credit the
 *   booking. This is what makes duplicate webhook deliveries safe.
 *
 * On top of the M-Pesa shape, this ALSO validates that the verified
 * transaction's amount and currency match what the Payment record
 * expects before ever marking it completed — the amount/currency
 * quoted by the webhook or redirect is never trusted, and a mismatch
 * here is a sign of tampering or a misconfigured integration, not
 * something to silently paper over. A mismatch is logged loudly and
 * the payment is left in its current state for manual review, rather
 * than either crediting the wrong amount or discarding the event.
 */
export async function applyPaystackResult(
  payment: PaymentDocument,
  result: PaystackResultData
): Promise<PaymentDocument> {
  const { verified } = result;
  const isSuccess = verified.status === "success";
  const isResolvedFailure = RESOLVED_FAILURE_STATUSES.has(verified.status);

  if (payment.status === PAYMENT_STATUSES.COMPLETED) {
    return payment;
  }
  if (payment.status === PAYMENT_STATUSES.FAILED && !isSuccess) {
    return payment;
  }
  if (!isSuccess && !isResolvedFailure) {
    // Still in flight on Paystack's side (e.g. "pending" while the
    // customer completes an M-Pesa PIN prompt) — nothing to apply yet.
    return payment;
  }

  if (isSuccess) {
    const expectedSubunit = Math.round(payment.amount * 100);
    const currencyMatches = verified.currency?.toUpperCase() === payment.currency?.toUpperCase();
    const amountMatches = verified.amount === expectedSubunit;
    const referenceMatches = verified.reference === payment.paystack.reference;

    if (!currencyMatches || !amountMatches || !referenceMatches) {
      logger.error("Paystack verification mismatch — payment NOT completed", {
        paymentId: String(payment._id),
        expectedReference: payment.paystack.reference,
        verifiedReference: verified.reference,
        expectedAmountSubunit: expectedSubunit,
        verifiedAmountSubunit: verified.amount,
        expectedCurrency: payment.currency,
        verifiedCurrency: verified.currency,
      });
      return payment;
    }
  }

  const claimed = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: isSuccess
        ? { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING, PAYMENT_STATUSES.FAILED] }
        : { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] },
      // Extra idempotency backstop specific to Paystack: never let a
      // second, different Paystack transaction id complete a Payment
      // that some earlier event already attached a transaction id to.
      "paystack.transactionId": { $in: [null, undefined, verified.id] },
    },
    {
      $set: {
        status: isSuccess ? PAYMENT_STATUSES.COMPLETED : PAYMENT_STATUSES.FAILED,
        "paystack.transactionId": verified.id,
        "paystack.channel": verified.channel,
        "paystack.gatewayResponse": verified.gateway_response,
        "paystack.ipAddress": verified.ip_address,
        ...(isSuccess
          ? {
              "paystack.paidAt": verified.paid_at ? new Date(verified.paid_at) : new Date(),
              "paystack.authorization": verified.authorization
                ? {
                    authorizationCode: verified.authorization.authorization_code,
                    last4: verified.authorization.last4,
                    cardType: verified.authorization.card_type,
                    bank: verified.authorization.bank,
                    channel: verified.authorization.channel,
                    reusable: verified.authorization.reusable,
                  }
                : undefined,
            }
          : { failureReason: verified.gateway_response || "Payment was not completed" }),
      },
    },
    { new: true }
  );

  if (!claimed) {
    // Another concurrent call (e.g. the webhook and a customer-triggered
    // callback verification landing at once) already resolved this
    // payment between our read and our write — that call owns the side
    // effects. Return the current persisted state rather than the stale
    // in-memory doc.
    return (await Payment.findById(payment._id)) ?? payment;
  }

  payment = claimed;

  if (isSuccess) {
    await creditBookingAndNotify(payment);
  } else {
    await notifyPaymentFailed(payment);
  }

  return payment;
}
