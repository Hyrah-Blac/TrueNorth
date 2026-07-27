import "server-only";
import type { PaymentDocument } from "@/database/models/Payment";
import User from "@/database/models/User";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { getBookingOrThrow, transitionBookingStatus } from "@/features/booking/lib/transitions";
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
 */
export async function applyMpesaResult(
  payment: PaymentDocument,
  result: MpesaResultData
): Promise<PaymentDocument> {
  if (payment.status === PAYMENT_STATUSES.COMPLETED || payment.status === PAYMENT_STATUSES.FAILED) {
    return payment;
  }

  payment.mpesa.resultCode = result.resultCode;
  payment.mpesa.resultDescription = result.resultDescription;

  if (result.resultCode === 0) {
    payment.status = PAYMENT_STATUSES.COMPLETED;
    payment.mpesa.mpesaReceiptNumber = result.mpesaReceiptNumber;
    payment.mpesa.transactionDate = result.transactionDate ?? new Date();
    await payment.save();

    let bookingNumber = "";

    try {
      const booking = await getBookingOrThrow(String(payment.booking));
      bookingNumber = booking.bookingNumber;
      booking.paidAmount += payment.amount;
      await booking.save();

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
  } else {
    payment.status = PAYMENT_STATUSES.FAILED;
    payment.failureReason = result.resultDescription;
    await payment.save();
  }

  return payment;
}