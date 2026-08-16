import "server-only";
import connectToDatabase from "@/database/connection";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import { initializeTransaction, verifyTransaction } from "@/lib/api/paystack";
import { applyPaystackResult, isResolvedPaystackStatus } from "./applyPaystackResult";
import { toWholeCurrencyUnit, toPaystackSubunit } from "@/utils/currency";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { PAYMENT_METHODS, PAYMENT_PROVIDERS, PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { BOOKING_TERMINAL_STATUSES } from "@/database/constants/booking-status";
import { siteConfig } from "@/lib/config/site";
import { logger } from "@/lib/logging/logger";

export type PaystackChannel = "mobile_money" | "card";

/**
 * How long a Paystack hosted-checkout attempt stays "in flight" before
 * a fresh attempt is allowed to supersede it. Unlike M-Pesa's ~60s STK
 * prompt, a customer can sit on Paystack's hosted checkout page for a
 * while (entering card details, switching tabs to grab a card, etc.),
 * so this window is deliberately more generous.
 */
const PAYSTACK_PENDING_GRACE_MS = 15 * 60 * 1000;

export interface InitiatePaystackPaymentResult {
  payment: PaymentDocument;
  authorizationUrl: string;
  accessCode: string;
}

/**
 * Initializes a Paystack transaction for a booking's outstanding
 * balance. The payable amount is always calculated from the booking
 * server-side (never accepted from the browser) — see step 8 of the
 * integration spec this implements.
 */
export async function initiatePaystackBookingPayment(
  bookingId: string,
  channel: PaystackChannel,
  requesterDbId: string,
  isAdmin: boolean
): Promise<InitiatePaystackPaymentResult> {
  await connectToDatabase();

  let booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");

  if (!isAdmin && String(booking.customer) !== String(requesterDbId)) {
    throw new ForbiddenError("You do not have access to this booking");
  }

  if (BOOKING_TERMINAL_STATUSES.includes(booking.status)) {
    throw new AppError(`This booking is ${booking.status} and cannot accept payment`, 409);
  }

  // Guard against a second Paystack checkout being created while one is
  // still plausibly in flight for this booking. Mirrors initiateBookingPayment's
  // M-Pesa guard: give the existing attempt a chance to resolve through
  // the same Paystack-verified path the webhook/callback use first —
  // applyPaystackResult is idempotent, so this is safe to call speculatively.
  const existingPayment = await Payment.findOne({
    booking: booking._id,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] },
  }).sort({ createdAt: -1 });

  if (existingPayment) {
    if (existingPayment.paystack.reference) {
      try {
        const verified = await verifyTransaction(existingPayment.paystack.reference);
        if (isResolvedPaystackStatus(verified.status)) {
          await applyPaystackResult(existingPayment, { verified });
        }
      } catch (error) {
        logger.warn("Could not verify existing pending Paystack payment before starting a new one", {
          paymentId: String(existingPayment._id),
          error: String(error),
        });
      }
    }

    const refreshedExisting = await Payment.findById(existingPayment._id);
    const stillPending =
      refreshedExisting &&
      (refreshedExisting.status === PAYMENT_STATUSES.PENDING ||
        refreshedExisting.status === PAYMENT_STATUSES.PROCESSING);

    if (stillPending && refreshedExisting) {
      const age = Date.now() - refreshedExisting.createdAt.getTime();

      if (age < PAYSTACK_PENDING_GRACE_MS) {
        throw new AppError(
          "A payment is already being processed for this booking. Please complete it, or wait a few minutes and try again.",
          409
        );
      }

      // Old enough to be considered abandoned — mark it failed so it
      // doesn't block new attempts forever. The conditional match on
      // its still-current status guards against a webhook resolving it
      // in this exact instant (that call wins; this one becomes a no-op).
      await Payment.findOneAndUpdate(
        { _id: refreshedExisting._id, status: refreshedExisting.status },
        { $set: { status: PAYMENT_STATUSES.FAILED, failureReason: "Payment attempt abandoned" } }
      );
    }

    // Reload the booking in case applyPaystackResult above credited it.
    const refreshedBooking = await Booking.findById(bookingId);
    if (refreshedBooking) booking = refreshedBooking;
  }

  const amount = toWholeCurrencyUnit(booking.balanceAmount);
  if (amount <= 0) {
    throw new AppError("This booking has no outstanding balance", 409);
  }

  const customer = await User.findById(booking.customer).select("email firstName lastName");
  if (!customer) throw new NotFoundError("Customer account not found");

  const method = channel === "card" ? PAYMENT_METHODS.CARD : PAYMENT_METHODS.MPESA;

  const payment = await Payment.create({
    booking: booking._id,
    customer: booking.customer,
    amount,
    currency: booking.currency,
    method,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    status: PAYMENT_STATUSES.PENDING,
  });

  // The Payment's own generated number is our unique reference to
  // Paystack — persisted immediately (before the API call) so it's
  // recorded even if initializeTransaction itself fails below.
  const reference = payment.paymentNumber;
  payment.paystack.reference = reference;
  await payment.save();

  try {
    const initialized = await initializeTransaction({
      email: customer.email,
      amount: toPaystackSubunit(amount),
      currency: booking.currency,
      reference,
      callbackUrl: `${siteConfig.url}/dashboard/payments/paystack/callback`,
      channels: [channel],
      metadata: {
        bookingId: String(booking._id),
        bookingNumber: booking.bookingNumber,
        paymentId: String(payment._id),
      },
    });

    payment.paystack.accessCode = initialized.access_code;
    payment.paystack.authorizationUrl = initialized.authorization_url;
    await payment.save();

    return { payment, authorizationUrl: initialized.authorization_url, accessCode: initialized.access_code };
  } catch (error) {
    payment.status = PAYMENT_STATUSES.FAILED;
    payment.failureReason = error instanceof Error ? error.message : "Failed to initialize Paystack payment";
    await payment.save();
    throw error;
  }
}
