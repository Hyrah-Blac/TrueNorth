import "server-only";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { requireAdmin } from "@/middleware/admin";
import { NotFoundError } from "@/lib/errors/AppError";
import type { IPayment } from "@/types/payment";
import type { PaymentStatus } from "@/database/constants/payment-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getPaymentsForAdmin(status?: PaymentStatus): Promise<IPayment[]> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const payments = await Payment.find(filter)
    .populate("booking", "bookingNumber departureAirportCode destinationAirportCode")
    .populate("customer", "firstName lastName email")
    .sort({ createdAt: -1 });

  return serialize<IPayment[]>(payments);
}

export async function getPaymentForAdmin(paymentId: string): Promise<IPayment> {
  await requireAdmin();
  await connectToDatabase();

  const payment = await Payment.findById(paymentId)
    .populate("booking")
    .populate("customer", "firstName lastName email phone");

  if (!payment) throw new NotFoundError("Payment not found");

  return serialize<IPayment>(payment);
}
