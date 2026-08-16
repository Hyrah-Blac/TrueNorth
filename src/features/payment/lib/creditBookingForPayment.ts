import "server-only";
import type { PaymentDocument } from "@/database/models/Payment";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { PAYMENT_METHODS } from "@/database/constants/payment-status";
import { NotFoundError } from "@/lib/errors/AppError";
import { transitionBookingStatus } from "@/features/booking/lib/transitions";
import { issueTicketForBooking } from "@/features/ticket/lib/issueTicketForBooking";
import { sendTicketConfirmationEmail } from "@/features/ticket/lib/sendTicketConfirmationEmail";
import { sendEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import PaymentReceipt from "@/emails/PaymentReceipt";
import { logger } from "@/lib/logging/logger";

/**
 * Applies the shared success side-effects for a payment that has
 * *already* been atomically marked COMPLETED by its provider-specific
 * apply function (applyMpesaResult / applyPaystackResult) — crediting
 * the booking, auto-confirming it once fully paid, issuing a ticket
 * and emailing it (PDF attached, Phase 4) once fully paid, and
 * emailing the customer's payment receipt.
 *
 * Split out so both providers share one code path for this logic
 * rather than maintaining two near-identical copies that could drift
 * out of sync (e.g. one forgetting the auto-confirm rule).
 *
 * Must only be called once per payment — the caller (each provider's
 * apply function) is responsible for the idempotency guard that
 * ensures a given payment can only reach this function one time, via
 * its own atomic conditional update. This function does not re-check
 * that itself, and calling it twice for the same payment WOULD
 * double-credit the booking.
 */
export async function creditBookingAndNotify(payment: PaymentDocument): Promise<void> {
  let bookingNumber = "";

  try {
    // Atomic increment rather than a read-modify-write — see the
    // detailed rationale in applyMpesaResult.ts. Concurrent increments
    // from two distinct completed payments always add up correctly
    // regardless of read timing.
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

    // Ticket issuance is deliberately its own try/catch, separate from
    // the booking-credit logic above: a ticket-issuance failure must
    // never be mistaken for (or silently swallowed alongside) a
    // booking-confirmation failure, and it must never roll back or
    // reverse a payment that has already been correctly recorded.
    // issueTicketForBooking is idempotent (see that file), so it's
    // safe to reach here on every completed payment for a booking that
    // is already fully paid — not just the one payment that tips it
    // over the balance — since a repeat call always finds the ticket
    // already exists and returns it instead of creating another one.
    if (booking.balanceAmount <= 0) {
      try {
        const { ticket } = await issueTicketForBooking(booking._id);
        // Only reached once a ticket genuinely exists — see Phase 4
        // requirement #8 (never email before the ticket is real).
        // sendTicketConfirmationEmail never throws (see that file): it
        // catches its own PDF/email failures and records them on the
        // ticket rather than letting them surface here, so a delivery
        // failure can never be mistaken for a ticket-issuance failure.
        await sendTicketConfirmationEmail(ticket._id);
      } catch (ticketError) {
        // The payment and booking are already correctly recorded —
        // that must not be undone. A ticket-issuance failure needs
        // manual admin attention or a retry (issueTicketForBooking is
        // idempotent and safe to call again for this booking), so log
        // it loudly here rather than letting it fail silently or be
        // confused with a payment/booking failure.
        logger.error("Payment completed and booking credited, but ticket issuance failed", {
          paymentId: String(payment._id),
          bookingId: String(booking._id),
          bookingNumber: booking.bookingNumber,
          error: String(ticketError),
        });
      }
    }
  } catch (error) {
    // The payment itself is already recorded as completed — that must
    // not be rolled back. A failure here needs manual admin attention,
    // so it's logged loudly rather than silently swallowed.
    logger.error("Payment completed but booking confirmation failed", {
      paymentId: String(payment._id),
      bookingId: String(payment.booking),
      provider: payment.provider,
      error: String(error),
    });
  }

  const customer = await User.findById(payment.customer).select("firstName email");
  if (!customer) return;

  const settings = await getSiteSettings();

  const methodLabel = payment.method === PAYMENT_METHODS.CARD ? "Card" : "M-Pesa";
  const providerReference =
    payment.provider === "paystack" ? payment.paystack.reference : payment.mpesa.mpesaReceiptNumber;
  const transactionDate =
    payment.provider === "paystack" ? payment.paystack.paidAt : payment.mpesa.transactionDate;

  await sendEmail({
    to: customer.email,
    subject: `Payment received — ${payment.paymentNumber}`,
    react: PaymentReceipt({
      customerName: customer.firstName,
      paymentNumber: payment.paymentNumber,
      bookingNumber,
      amount: formatCurrency(payment.amount, payment.currency),
      methodLabel,
      providerReference,
      transactionDate: formatDateTime(transactionDate ?? new Date()),
      receiptUrl: `${siteConfig.url}/dashboard/payments/${payment._id}`,
      contact: toEmailContact(settings),
    }),
  });
}
