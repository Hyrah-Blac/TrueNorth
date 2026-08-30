import "server-only";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { PAYMENT_STATUSES, BOOKING_CREDIT_STATUSES } from "@/database/constants/payment-status";
import { creditBookingAndNotify } from "@/features/payment/lib/creditBookingForPayment";
import { logger } from "@/lib/logging/logger";

/**
 * FIX 2 reconciliation mechanism: finds payments whose FINANCIAL state
 * is durably COMPLETED but whose BOOKING SIDE-EFFECT state
 * (bookingCreditStatus — see Payment.ts) never finished, and retries
 * creditBookingAndNotify for each. That function is fully idempotent
 * (see its own docstring), so calling it again for a payment that
 * actually did finish just returns immediately without touching
 * anything.
 *
 * Three situations are covered:
 *  - bookingCreditStatus === PENDING: creditBookingAndNotify was never
 *    called at all for this payment (e.g. the process crashed between
 *    the Payment being marked COMPLETED and the credit call).
 *  - bookingCreditStatus === FAILED: a previous attempt started and
 *    threw partway through — see the FAILED branch in
 *    creditBookingForPayment.ts.
 *  - bookingCreditStatus === PROCESSING for longer than
 *    STUCK_PROCESSING_MINUTES: a previous attempt claimed the retry
 *    (flipped to PROCESSING) but never reached COMPLETED or FAILED —
 *    most likely the process was killed mid-way. Treated the same as
 *    FAILED so it isn't stuck forever; creditBookingAndNotify's own
 *    claim (`bookingCreditStatus: { $in: [PENDING, FAILED] }`) won't
 *    pick up a plain PROCESSING record, so this job explicitly resets
 *    it to FAILED first.
 *
 * Intended to run every few minutes via a scheduled job hitting
 * /api/cron/reconcile-payment-credits (see verifyCronSecret — the
 * project's existing cron auth pattern, e.g. cleanup-expired-quotes
 * and booking-reminders). No new job-queue infrastructure is
 * introduced — this reuses the same lightweight cron-endpoint pattern
 * already in the codebase.
 */
const STUCK_PROCESSING_MINUTES = 15;
const MAX_ATTEMPTS_BEFORE_SKIPPING = 10;

export async function reconcilePaymentCredits(): Promise<{
  reconciled: number;
  stillFailed: number;
  skipped: number;
}> {
  await connectToDatabase();

  const stuckProcessingCutoff = new Date(Date.now() - STUCK_PROCESSING_MINUTES * 60 * 1000);

  // Reclaim anything stuck in PROCESSING past the cutoff so it becomes
  // retryable again (see rationale above).
  await Payment.updateMany(
    {
      status: PAYMENT_STATUSES.COMPLETED,
      bookingCreditStatus: BOOKING_CREDIT_STATUSES.PROCESSING,
      bookingCreditLastAttemptAt: { $lt: stuckProcessingCutoff },
    },
    {
      $set: {
        bookingCreditStatus: BOOKING_CREDIT_STATUSES.FAILED,
        bookingCreditLastError: "Reclaimed by reconciliation job after being stuck in PROCESSING",
      },
    }
  );

  const candidates = await Payment.find({
    status: PAYMENT_STATUSES.COMPLETED,
    bookingCreditStatus: { $in: [BOOKING_CREDIT_STATUSES.PENDING, BOOKING_CREDIT_STATUSES.FAILED] },
  }).limit(200);

  let reconciled = 0;
  let stillFailed = 0;
  let skipped = 0;

  for (const payment of candidates) {
    if (payment.bookingCreditAttempts >= MAX_ATTEMPTS_BEFORE_SKIPPING) {
      // Repeated, consistent failure — most likely a data problem
      // (e.g. the booking was deleted) rather than a transient one.
      // Stop hammering it automatically; surfaced via bookingCreditStatus
      // = FAILED on the payment for admin review instead.
      skipped += 1;
      logger.error("Payment credit reconciliation exceeded max attempts — needs manual review", {
        paymentId: String(payment._id),
        attempts: payment.bookingCreditAttempts,
        lastError: payment.bookingCreditLastError,
      });
      continue;
    }

    await creditBookingAndNotify(payment);

    const refreshed = await Payment.findById(payment._id).select("bookingCreditStatus");
    if (refreshed?.bookingCreditStatus === BOOKING_CREDIT_STATUSES.COMPLETED) {
      reconciled += 1;
    } else {
      stillFailed += 1;
    }
  }

  logger.info("Payment credit reconciliation complete", {
    checked: candidates.length,
    reconciled,
    stillFailed,
    skipped,
  });

  return { reconciled, stillFailed, skipped };
}
