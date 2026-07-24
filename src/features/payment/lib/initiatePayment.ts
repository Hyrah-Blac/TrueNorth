import "server-only";
import connectToDatabase from "@/database/connection";
import Payment, { type PaymentDocument } from "@/database/models/Payment";
import Booking from "@/database/models/Booking";
import { initiateStkPush, type StkPushResponse } from "@/lib/api/mpesa";
import { toMpesaPhoneFormat } from "@/utils/format";
import { toWholeCurrencyUnit } from "@/utils/currency";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { BOOKING_TERMINAL_STATUSES } from "@/database/constants/booking-status";

export async function initiateBookingPayment(
  bookingId: string,
  phoneNumber: string,
  requesterDbId: string,
  isAdmin: boolean
): Promise<{ payment: PaymentDocument; stkResponse: StkPushResponse }> {
  await connectToDatabase();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");

  if (!isAdmin && String(booking.customer) !== String(requesterDbId)) {
    throw new ForbiddenError("You do not have access to this booking");
  }

  if (BOOKING_TERMINAL_STATUSES.includes(booking.status)) {
    throw new AppError(`This booking is ${booking.status} and cannot accept payment`, 409);
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
