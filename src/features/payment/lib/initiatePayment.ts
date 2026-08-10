import "server-only";
import connectToDatabase from "@/database/connection";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import Booking from "@/database/models/Booking";
import { initiateStkPush, queryStkPushStatus, type StkPushResponse } from "@/lib/api/mpesa";
import { MPESA_SUCCESS, shouldTrustQueryFailure } from "@/lib/api/mpesaResultCodes";
import { applyMpesaResult } from "./applyMpesaResult";
import { toMpesaPhoneFormat } from "@/utils/format";
import { toWholeCurrencyUnit } from "@/utils/currency";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { BOOKING_TERMINAL_STATUSES } from "@/database/constants/booking-status";
import { logger } from "@/lib/logging/logger";

export async function initiateBookingPayment(
  bookingId: string,
  phoneNumber: string,
  requesterDbId: string,
  isAdmin: boolean
): Promise<{ payment: PaymentDocument; stkResponse: StkPushResponse }> {
  await connectToDatabase();

  let booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");

  if (!isAdmin && String(booking.customer) !== String(requesterDbId)) {
    throw new ForbiddenError("You do not have access to this booking");
  }

  if (BOOKING_TERMINAL_STATUSES.includes(booking.status)) {
    throw new AppError(`This booking is ${booking.status} and cannot accept payment`, 409);
  }

  // Guard against a second STK push while one is already in flight for
  // this booking. Rather than blocking outright on any pending record
  // (which could permanently strand a customer if a callback was ever
  // lost), first give the existing attempt a chance to resolve through
  // the same Safaricom-verified path the webhook and status-check use —
  // applyMpesaResult is idempotent, so this is safe to call speculatively.
  const existingPayment = await Payment.findOne({
    booking: booking._id,
    status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] },
  }).sort({ createdAt: -1 });

  if (existingPayment) {
    if (existingPayment.mpesa.checkoutRequestId) {
      try {
        const queryResult = await queryStkPushStatus(existingPayment.mpesa.checkoutRequestId);
        const resultCode = Number(queryResult.ResultCode);
        if (!Number.isNaN(resultCode)) {
          const isSuccess = resultCode === MPESA_SUCCESS;
          // Same rule as checkPaymentStatus: trust success immediately,
          // but don't let a possibly-premature failure from the query
          // block a brand-new payment attempt before the existing
          // prompt would realistically have been resolved.
          if (isSuccess || shouldTrustQueryFailure(existingPayment.createdAt)) {
            await applyMpesaResult(existingPayment, { resultCode, resultDescription: queryResult.ResultDesc });
          }
        }
      } catch (error) {
        logger.warn("Could not verify existing pending payment before starting a new one", {
          paymentId: String(existingPayment._id),
          error: String(error),
        });
      }
    }

    if (
      existingPayment.status === PAYMENT_STATUSES.PENDING ||
      existingPayment.status === PAYMENT_STATUSES.PROCESSING
    ) {
      throw new AppError(
        "A payment is already being processed for this booking. Please check your phone or wait for the payment status to update.",
        409
      );
    }

    // The stale payment resolved (e.g. to failed) — reload the booking
    // in case applyMpesaResult also updated it (a completed result
    // would credit paidAmount and change the balance below).
    const refreshed = await Booking.findById(bookingId);
    if (refreshed) booking = refreshed;
  }

  const amount = toWholeCurrencyUnit(booking.balanceAmount);
  if (amount <= 0) {
    throw new AppError("This booking has no outstanding balance", 409);
  }

  const mpesaPhone = toMpesaPhoneFormat(phoneNumber);

  const payment = await Payment.create({
    booking: booking._id,
    customer: booking.customer,
    amount,
    currency: booking.currency,
    method: PAYMENT_METHODS.MPESA,
    status: PAYMENT_STATUSES.PENDING,
    mpesa: { phoneNumber: mpesaPhone },
  });

  try {
    const stkResponse = await initiateStkPush({
      phoneNumber: mpesaPhone,
      amount,
      accountReference: booking.bookingNumber,
      transactionDesc: "Charter payment",
    });

    payment.mpesa.merchantRequestId = stkResponse.MerchantRequestID;
    payment.mpesa.checkoutRequestId = stkResponse.CheckoutRequestID;
    payment.status = PAYMENT_STATUSES.PROCESSING;
    await payment.save();

    return { payment, stkResponse };
  } catch (error) {
    payment.status = PAYMENT_STATUSES.FAILED;
    payment.failureReason = error instanceof Error ? error.message : "Failed to initiate payment";
    await payment.save();
    throw error;
  }
}