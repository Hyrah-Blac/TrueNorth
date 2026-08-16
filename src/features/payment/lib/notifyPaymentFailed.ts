import "server-only";
import type { PaymentDocument } from "@/database/models/Payment";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import { PAYMENT_METHODS } from "@/database/constants/payment-status";
import { sendEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import PaymentFailed from "@/emails/PaymentFailed";
import { logger } from "@/lib/logging/logger";

/**
 * Applies the shared failure side-effect for a payment that has
 * *already* been atomically marked FAILED by its provider-specific
 * apply function (applyMpesaResult / applyPaystackResult) — emails
 * the customer a calm, actionable notice.
 *
 * Split out so both providers share one code path, the same reason
 * creditBookingAndNotify exists for the success path — see that file.
 *
 * Must only be called once per payment, immediately after the caller's
 * own atomic conditional update wins the claim on transitioning that
 * payment into FAILED. Both applyMpesaResult and applyPaystackResult
 * already guarantee this: their early-return checks mean a payment
 * that is already FAILED is returned unchanged rather than re-entering
 * the branch that calls this function, so a customer is never emailed
 * twice for the same failed attempt (e.g. a webhook and a
 * customer-triggered status check racing, or a retried/duplicate
 * webhook delivery).
 *
 * Best-effort only: sendEmail never throws (see resend.ts), and any
 * failure to look up the booking/customer here is logged and
 * swallowed rather than surfaced — a notification failure must never
 * be mistaken for, or interfere with, the payment failure it's
 * reporting on, which is already correctly recorded regardless of
 * whether this email goes out.
 */
export async function notifyPaymentFailed(payment: PaymentDocument): Promise<void> {
  try {
    const [booking, customer] = await Promise.all([
      Booking.findById(payment.booking).select("bookingNumber"),
      User.findById(payment.customer).select("firstName email"),
    ]);

    if (!booking || !customer) return;

    const settings = await getSiteSettings();
    const methodLabel = payment.method === PAYMENT_METHODS.CARD ? "Card" : "M-Pesa";

    await sendEmail({
      to: customer.email,
      subject: `Payment unsuccessful — ${payment.paymentNumber}`,
      react: PaymentFailed({
        customerName: customer.firstName,
        paymentNumber: payment.paymentNumber,
        bookingNumber: booking.bookingNumber,
        amount: formatCurrency(payment.amount, payment.currency),
        methodLabel,
        retryUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
        contact: toEmailContact(settings),
      }),
    });
  } catch (error) {
    logger.error("Failed to send payment-failed notification", {
      paymentId: String(payment._id),
      bookingId: String(payment.booking),
      error: String(error),
    });
  }
}
