import "server-only";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { creditBookingAndNotify } from "./creditBookingForPayment";

export interface MpesaResultData {
  resultCode: number;
  resultDescription: string;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
}

/**
 * Applies a definitive M-Pesa result (from the async callback or a
 * manual status query) to the matching Payment, and confirms the
 * linked Booking once the result is a success.
 *
 * Idempotent by design: a Payment already COMPLETED is returned
 * unchanged — that is a confirmed, real success and must never be
 * overwritten. This matters because two independent paths can call
 * this — the webhook callback and a customer-triggered "check status"
 * query — and a race between them must never apply the same payment
 * twice or double-credit a booking.
 *
 * FAILED is treated as terminal too, EXCEPT it can still be upgraded
 * to COMPLETED by a later verified success. That's deliberate: a
 * failure can get written from a live status query whose Daraja
 * ResultCode was premature or flaky (see shouldTrustQueryFailure in
 * mpesaResultCodes.ts) — the customer may go on to actually complete
 * the payment, and the real callback with ResultCode 0 must still be
 * able to land, or a paid customer gets silently stuck as "failed"
 * with no booking credit.
 *
 * The terminal-state check below is only a fast path for the common
 * case. The actual guard against a double-apply is the conditional
 * findOneAndUpdate that follows: it only writes (and only this call
 * "wins") if the Payment is in a status this result is allowed to
 * overwrite at the moment of the update, the same atomic-claim shape
 * used for quotes and bookings. Without that, two near-simultaneous
 * calls (e.g. the M-Pesa webhook and the customer's "recheck payment"
 * hitting at once) could both read a pending payment before either
 * had saved, and both would then mark it completed and increment the
 * booking's paidAmount — double-crediting the booking.
 *
 * The paidAmount credit itself is also applied via an atomic $inc
 * (not a read-modify-write), so it stays correct even if two distinct
 * completed payments for the same booking are applied close together.
 */
export async function applyMpesaResult(
  payment: PaymentDocument,
  result: MpesaResultData
): Promise<PaymentDocument> {
  const isSuccess = result.resultCode === 0;

  if (payment.status === PAYMENT_STATUSES.COMPLETED) {
    return payment;
  }
  if (payment.status === PAYMENT_STATUSES.FAILED && !isSuccess) {
    return payment;
  }

  const claimed = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: isSuccess
        ? { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING, PAYMENT_STATUSES.FAILED] }
        : { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] },
    },
    {
      $set: {
        status: isSuccess ? PAYMENT_STATUSES.COMPLETED : PAYMENT_STATUSES.FAILED,
        "mpesa.resultCode": result.resultCode,
        "mpesa.resultDescription": result.resultDescription,
        ...(isSuccess
          ? {
              "mpesa.mpesaReceiptNumber": result.mpesaReceiptNumber,
              "mpesa.transactionDate": result.transactionDate ?? new Date(),
            }
          : { failureReason: result.resultDescription }),
      },
    },
    { new: true }
  );

  if (!claimed) {
    // Another concurrent call already resolved this payment between our
    // read and our write — that call owns the side effects, this one is
    // done. Return the current state rather than the stale in-memory doc.
    return (await Payment.findById(payment._id)) ?? payment;
  }

  payment = claimed;

  if (isSuccess) {
    await creditBookingAndNotify(payment);
  }

  return payment;
}