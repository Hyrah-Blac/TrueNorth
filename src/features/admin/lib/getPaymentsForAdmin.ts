import "server-only";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before populate runs

import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import { requireAdmin } from "@/middleware/admin";
import { NotFoundError } from "@/lib/errors/AppError";
import { escapeRegExp } from "@/utils/validators";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/utils/pagination";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/database/constants/payment-status";
import type { IPayment } from "@/types/payment";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export interface AdminPaymentFilters {
  status?: PaymentStatus;
  /** Matches payment reference, M-Pesa receipt/checkout ID, booking reference, or customer name/email/phone. */
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface AdminPaymentListResult {
  items: IPayment[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Builds the shared Mongo filter for a set of admin payment filters —
 * used by both the paginated list query and the summary aggregation so
 * the two can never disagree about which payments are "in view".
 */
async function buildPaymentQuery(filters: AdminPaymentFilters): Promise<Record<string, unknown>> {
  const query: Record<string, unknown> = {};

  if (filters.status) query.status = filters.status;

  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) createdAt.$lte = filters.dateTo;
    query.createdAt = createdAt;
  }

  if (filters.search) {
    const pattern = escapeRegExp(filters.search);
    const regex = { $regex: pattern, $options: "i" };

    // Same two-step cross-collection shape as Step 4's booking search:
    // resolve matching bookings/customers first, then OR their ids in
    // alongside a direct match on the payment's own reference fields.
    const [matchingBookings, matchingCustomers] = await Promise.all([
      Booking.find({ bookingNumber: regex }).select("_id"),
      User.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }] }).select(
        "_id"
      ),
    ]);

    query.$or = [
      { paymentNumber: regex },
      { "mpesa.mpesaReceiptNumber": regex },
      { "mpesa.checkoutRequestId": regex },
      { "paystack.reference": regex },
      { booking: { $in: matchingBookings.map((b) => b._id) } },
      { customer: { $in: matchingCustomers.map((c) => c._id) } },
    ];
  }

  return query;
}

export async function getPaymentsForAdmin(filters: AdminPaymentFilters = {}): Promise<AdminPaymentListResult> {
  await requireAdmin();
  await connectToDatabase();

  const page = filters.page && filters.page > 0 ? filters.page : DEFAULT_PAGE;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : DEFAULT_PAGE_SIZE;
  const query = await buildPaymentQuery(filters);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Payment.find(query)
      .populate({
        path: "booking",
        select: "bookingNumber departureAirportCode destinationAirportCode aircraft",
        populate: { path: "aircraft", select: "name model registration" },
      })
      .populate("customer", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return { items: serialize<IPayment[]>(items), total, page, limit };
}

export interface AdminPaymentSummary {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  totalCompletedAmount: number;
}

/** Server-side counts/totals for the current filter set — never derived from a paginated page of results. */
export async function getPaymentSummary(filters: AdminPaymentFilters = {}): Promise<AdminPaymentSummary> {
  await requireAdmin();
  await connectToDatabase();

  // Summary ignores page/limit deliberately — it always reflects the
  // full filtered set, not just the visible page.
  const query = await buildPaymentQuery({ ...filters, page: undefined, limit: undefined });

  const [total, completed, inProgress, failed, completedAmountAgg] = await Promise.all([
    Payment.countDocuments(query),
    Payment.countDocuments({ ...query, status: PAYMENT_STATUSES.COMPLETED }),
    Payment.countDocuments({ ...query, status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] } }),
    Payment.countDocuments({ ...query, status: PAYMENT_STATUSES.FAILED }),
    Payment.aggregate([
      { $match: { ...query, status: PAYMENT_STATUSES.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return {
    total,
    completed,
    inProgress,
    failed,
    totalCompletedAmount: completedAmountAgg[0]?.total ?? 0,
  };
}

export async function getPaymentForAdmin(paymentId: string): Promise<IPayment> {
  await requireAdmin();
  await connectToDatabase();

  const payment = await Payment.findById(paymentId)
    .populate({
      path: "booking",
      populate: { path: "aircraft", select: "name model registration passengerCapacity" },
    })
    .populate("customer", "firstName lastName email phone");

  if (!payment) throw new NotFoundError("Payment not found");

  return serialize<IPayment>(payment);
}