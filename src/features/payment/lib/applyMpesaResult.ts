import "server-only";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { transitionBookingStatus } from "@/features/booking/lib/transitions";
import { NotFoundError } from "@/lib/errors/AppError";
import { sendEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import PaymentReceipt from "@/emails/PaymentReceipt";
import { logger } from "@/lib/logging/logger";

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
 * Idempotent by design: a Payment already in a terminal state
 * (completed/failed) is returned unchanged. This matters because two
 * independent paths can call this — the webhook callback and a
 * customer-triggered "check status" query — and a race between them
 * must never apply the same payment twice or double-credit a booking.
 *
 * The terminal-state check below is only a fast path for the common
 * case. The actual guard against a double-apply is the conditional
 * findOneAndUpdate that follows: it only writes (and only this call
 * "wins") if the Payment is still pending/processing at the moment of
 * the update, the same atomic-claim shape used for quotes and
 * bookings. Without that, two near-simultaneous calls (e.g. the M-Pesa
 * webhook and the customer's "recheck payment" hitting at once) could
 * both read a pending payment before either had saved, and both would
 * then mark it completed and increment the booking's paidAmount —
 * double-crediting the booking.
 *
 * The paidAmount credit itself is also applied via an atomic $inc
 * (not a read-modify-write), so it stays correct even if two distinct
 * completed payments for the same booking are applied close together.
 */
export async function applyMpesaResult(
  payment: PaymentDocument,
  result: MpesaResultData
): Promise<PaymentDocument> {
  if (payment.status === PAYMENT_STATUSES.COMPLETED || payment.status === PAYMENT_STATUSES.FAILED) {
    return payment;
  }

  const isSuccess = result.resultCode === 0;

  const claimed = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] },
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
    let bookingNumber = "";

    try {
      // Atomic increment rather than a read-modify-write (paidAmount +=
      // amount; save()) — the read-then-write version can lose an update
      // if two payments for the same booking ever resolve close together
      // (e.g. a webhook and a manual recheck landing on two different
      // in-flight payments), silently under-crediting the booking. $inc
      // is applied server-side by Mongo against the current stored value,
      // so concurrent increments always add up correctly regardless of
      // read timing.
      const booking = await Booking.findByIdAndUpdate(
        payment.booking,
        { $inc: { paidAmount: payment.amount } },
        { new: true }
      );

      if (!booking) throw new NotFoundError("Booking not found");

      bookingNumber = booking.bookingNumber;

      if (booking.balanceAmount <= 0 && booking.status === BOOKING_STATUSES.PENDING) {
        await transitionBookingStatus(booking, BOOKING_STATUSES.CONFIRMED, {
          note: `Confirmed automatically after payment ${payment.paymentNumber}`,
        });
      }
    } catch (error) {
      // The payment itself is already recorded as completed above —
      // that must not be rolled back. A failure here means the
      // booking needs manual admin attention, so it's logged loudly
      // rather than silently swallowed.
      logger.error("Payment completed but booking confirmation failed", {
        paymentId: String(payment._id),
        bookingId: String(payment.booking),
        error: String(error),
      });
    }

    const customer = await User.findById(payment.customer).select("firstName email");
    if (customer) {
      const settings = await getSiteSettings();

      await sendEmail({
        to: customer.email,
        subject: `Payment received — ${payment.paymentNumber}`,
        react: PaymentReceipt({
          customerName: customer.firstName,
          paymentNumber: payment.paymentNumber,
          bookingNumber,
          amount: formatCurrency(payment.amount, payment.currency),
          mpesaReceiptNumber: payment.mpesa.mpesaReceiptNumber,
          transactionDate: formatDateTime(payment.mpesa.transactionDate ?? new Date()),
          receiptUrl: `${siteConfig.url}/dashboard/payments/${payment._id}`,
          contact: toEmailContact(settings),
        }),
      });
    }
  }

  return payment;
}