import "server-only";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
// Side-effect import: registers the Booking schema with Mongoose before
// .populate("booking", ...) below runs. Without this, if getMyPayments is
// the first code path to touch the database in a fresh server/serverless
// instance, Mongoose has never seen the Booking schema and populate()
// throws "Schema hasn't been registered for model 'Booking'".
import "@/database/models/Booking";
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

/** Payment attempts (pending/failed/completed) for a single booking, most recent first. */
export async function getMyPaymentsForBooking(bookingId: string): Promise<IPayment[]> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const payments = await Payment.find({ booking: bookingId, customer: user._id }).sort({ createdAt: -1 });

  return serialize<IPayment[]>(payments);
}