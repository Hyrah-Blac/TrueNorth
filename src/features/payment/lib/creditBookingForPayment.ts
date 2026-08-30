import "server-only";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { PAYMENT_METHODS } from "@/database/constants/payment-status";
import { BOOKING_CREDIT_STATUSES, RECEIPT_NOTIFICATION_STATUSES } from "@/database/constants/payment-status";
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
 * and emailing it (PDF attached) once fully paid, and emailing the
 * customer's payment receipt.
 *
 * Split out so both providers share one code path for this logic
 * rather than maintaining two near-identical copies that could drift
 * out of sync (e.g. one forgetting the auto-confirm rule).
 *
 * FIX (payment-success-but-side-effect-failure): this used to have no
 * persisted state of its own — if it threw partway through, the
 * *payment* was already durably COMPLETED, but nothing recorded that
 * the booking still needed crediting. Every later call into this
 * payment (a duplicate webhook, a customer "check status" retrigger)
 * took applyMpesaResult/applyPaystackResult's fast path — "status is
 * already COMPLETED, nothing to do" — and this function was never
 * invoked again. The booking side effects could then be stuck forever
 * with no automatic way to retry them.
 *
 * The fix separates PAYMENT FINANCIAL STATE (Payment.status) from
 * BOOKING SIDE-EFFECT STATE (Payment.bookingCreditStatus/
 * bookingCreditAttempts/bookingCreditLastError/
 * bookingCreditLastAttemptAt/bookingCreditedAt — see Payment.ts).
 * That second piece of state is what this function now claims,
 * updates, and — critically — leaves in a FAILED-but-retryable state
 * on error, instead of only logging. jobs/reconcile-payment-credits.ts
 * periodically finds payments stuck in that state and calls this
 * function again.
 *
 * Idempotency:
 *  - This function is now safe to call any number of times for the
 *    same payment, regardless of Payment.status. A first call claims
 *    the retry via an atomic findOneAndUpdate (bookingCreditStatus
 *    PENDING/FAILED -> PROCESSING); a concurrent or overlapping call
 *    that loses that race returns immediately without touching
 *    anything (no double-processing).
 *  - The one genuinely non-idempotent step — incrementing
 *    Booking.paidAmount — is separately guarded by bookingCreditedAt:
 *    only applied once per payment, ever, even across many retries.
 *  - Ticket issuance is already idempotent (see issueTicketForBooking)
 *    and safe to call again on every retry.
 */
export async function creditBookingAndNotify(payment: PaymentDocument): Promise<void> {
  let bookingNumber = "";
  let creditAlreadyComplete = payment.bookingCreditStatus === BOOKING_CREDIT_STATUSES.COMPLETED;

  if (creditAlreadyComplete) {
    // HARDENING — credit already fully applied on a previous call:
    // this used to `return` immediately here, which was correct for
    // "don't double-credit" (Test 12) but had a side effect the
    // hardening pass closes — it also made it impossible to ever
    // retry JUST the receipt notification for a payment whose credit
    // had already succeeded but whose email had failed. Instead, skip
    // straight past the credit-claim logic below (nothing to redo)
    // and fall through to the notification section, which has its own
    // idempotency guard (receiptNotificationStatus) and is exactly
    // what makes an independent notification retry possible — see
    // Test 4 in the hardening scenarios.
    const booking = await Booking.findById(payment.booking).select("bookingNumber");
    bookingNumber = booking?.bookingNumber ?? "";
  } else {
    // Atomic claim: only proceed if we're the ones flipping this
    // payment's credit state from PENDING/FAILED to PROCESSING. A
    // second, overlapping call (e.g. the webhook and the reconciliation
    // job landing at the same time) that loses this race exits here
    // rather than re-running the side effects concurrently.
    const claimed = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        bookingCreditStatus: { $in: [BOOKING_CREDIT_STATUSES.PENDING, BOOKING_CREDIT_STATUSES.FAILED] },
      },
      {
        $set: { bookingCreditStatus: BOOKING_CREDIT_STATUSES.PROCESSING, bookingCreditLastAttemptAt: new Date() },
        $inc: { bookingCreditAttempts: 1 },
      },
      { new: true }
    );

    if (!claimed) {
      // Another call currently holds the PROCESSING claim — not our
      // job right now. We also don't yet know how it will resolve, so
      // this call deliberately does NOT attempt the notification
      // either (that would risk a duplicate send if the other call is
      // also about to reach its own notification section). Whichever
      // call actually finishes — or a later reconciliation pass —
      // will reach the notification section correctly once
      // bookingCreditStatus settles.
      return;
    }

    payment = claimed;

    try {
    // The $inc against Booking.paidAmount is the one step that must
    // never run twice for the same payment — guarded by
    // bookingCreditedAt rather than relying solely on the PROCESSING
    // claim above, since a retry after a mid-step crash still needs
    // to skip straight past this on its next attempt.
    let booking = await Booking.findById(payment.booking);
    if (!booking) throw new NotFoundError("Booking not found");

    if (!payment.bookingCreditedAt) {
      // Atomic increment rather than a read-modify-write — see the
      // detailed rationale historically kept in applyMpesaResult.ts.
      // Concurrent increments from two distinct completed payments
      // always add up correctly regardless of read timing.
      const updatedBooking = await Booking.findByIdAndUpdate(
        payment.booking,
        { $inc: { paidAmount: payment.amount } },
        { new: true }
      );
      if (!updatedBooking) throw new NotFoundError("Booking not found");
      booking = updatedBooking;

      await Payment.updateOne({ _id: payment._id }, { $set: { bookingCreditedAt: new Date() } });
    }

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
        // Only reached once a ticket genuinely exists.
        // sendTicketConfirmationEmail never throws (see that file): it
        // catches its own PDF/email failures and records them on the
        // ticket rather than letting them surface here, so a delivery
        // failure can never be mistaken for a ticket-issuance failure,
        // and (per FIX 2's "notifications" requirement) never causes
        // this payment to be treated as still needing a credit retry.
        await sendTicketConfirmationEmail(ticket._id);
      } catch (ticketError) {
        // The payment and booking are already correctly recorded —
        // that must not be undone, and this must not mark the credit
        // as FAILED (which would just re-run the already-successful
        // paidAmount/confirm steps pointlessly on retry). Ticket
        // issuance needs manual admin attention or its own retry
        // (issueTicketForBooking is idempotent and safe to call again
        // for this booking), so log it loudly here rather than
        // letting it fail silently or be confused with a credit failure.
        logger.error("Payment completed and booking credited, but ticket issuance failed", {
          paymentId: String(payment._id),
          bookingId: String(booking._id),
          bookingNumber: booking.bookingNumber,
          error: String(ticketError),
        });
      }
    }

    await Payment.updateOne(
      { _id: payment._id },
      { $set: { bookingCreditStatus: BOOKING_CREDIT_STATUSES.COMPLETED } }
    );
  } catch (error) {
    // The payment itself is already recorded as completed — that must
    // not be rolled back. Persist the failure so the reconciliation
    // job (jobs/reconcile-payment-credits.ts) can find and retry it,
    // in addition to logging it loudly for immediate visibility.
    const message = error instanceof Error ? error.message : String(error);
    await Payment.updateOne(
      { _id: payment._id },
      { $set: { bookingCreditStatus: BOOKING_CREDIT_STATUSES.FAILED, bookingCreditLastError: message.slice(0, 1000) } }
    ).catch((updateError) => {
      logger.error("Failed to persist bookingCreditStatus=FAILED after credit error", {
        paymentId: String(payment._id),
        error: String(updateError),
      });
    });

    logger.error("Payment completed but booking confirmation failed", {
      paymentId: String(payment._id),
      bookingId: String(payment.booking),
      provider: payment.provider,
      error: message,
    });

    // Booking credit (the money-affecting part) failing shouldn't
    // block the payment receipt email below — the customer did pay,
    // and should know that, even while ops resolves the booking side.
    }
  }

  // HARDENING — the receipt email is now its own idempotency-guarded
  // step, entirely independent of bookingCreditStatus above (whether
  // that block above succeeded, failed, or was skipped because it had
  // already completed on a previous call). Two things this closes:
  //
  //  1. Previously, every call to this function unconditionally tried
  //     to send the email again — meaning a reconciliation retry of a
  //     payment whose credit failed but whose email had *already* sent
  //     successfully would re-send that email every single retry. The
  //     `receiptNotificationStatus === SENT` short-circuit below stops
  //     that.
  //  2. A failed email attempt is now recorded (receiptNotificationStatus
  //     = FAILED / receiptNotificationLastError) instead of only logged
  //     — visible on the Payment record for support/ops, and, most
  //     importantly, it is NEVER written to bookingCreditStatus, so it
  //     can never cause the reconciliation job to mistake "email
  //     failed" for "booking credit failed" and redo an
  //     already-completed credit operation.
  const freshPayment = await Payment.findById(payment._id).select("receiptNotificationStatus");
  if (freshPayment?.receiptNotificationStatus === RECEIPT_NOTIFICATION_STATUSES.SENT) {
    return;
  }

  const customer = await User.findById(payment.customer).select("firstName email");
  if (!customer) return;

  const settings = await getSiteSettings();

  const methodLabel = payment.method === PAYMENT_METHODS.CARD ? "Card" : "M-Pesa";
  const providerReference =
    payment.provider === "paystack" ? payment.paystack.reference : payment.mpesa.mpesaReceiptNumber;
  const transactionDate =
    payment.provider === "paystack" ? payment.paystack.paidAt : payment.mpesa.transactionDate;

  try {
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

    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          receiptNotificationStatus: RECEIPT_NOTIFICATION_STATUSES.SENT,
          receiptNotificationSentAt: new Date(),
        },
      }
    );
  } catch (emailError) {
    // Per FIX 2's "notifications" requirement: an email failure must
    // never be treated as a payment/booking-credit failure — the
    // financial and booking-credit state above is already durably
    // correct regardless of whether this receipt email sends. Only
    // receiptNotificationStatus reflects this failure.
    const message = emailError instanceof Error ? emailError.message : String(emailError);
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          receiptNotificationStatus: RECEIPT_NOTIFICATION_STATUSES.FAILED,
          receiptNotificationLastError: message.slice(0, 1000),
        },
      }
    ).catch(() => undefined);

    logger.error("Payment receipt email failed to send", {
      paymentId: String(payment._id),
      error: message,
    });
  }
}
