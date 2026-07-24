import "server-only";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import type { IPayment } from "@/types/payment";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getMyPayments(): Promise<IPayment[]> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const payments = await Payment.find({ customer: user._id })
    .populate("booking", "bookingNumber departureAirportCode destinationAirportCode")
    .sort({ createdAt: -1 });

  return serialize<IPayment[]>(payments);
}

export async function getMyPaymentById(paymentId: string): Promise<IPayment> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const payment = await Payment.findById(paymentId).populate("booking");
  if (!payment) throw new NotFoundError("Payment not found");

  if (String(payment.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this payment");
  }

  return serialize<IPayment>(payment);
}
