import "server-only";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import Aircraft from "@/database/models/Aircraft";
import { requireAdmin } from "@/middleware/admin";
import { NotFoundError } from "@/lib/errors/AppError";
import { escapeRegExp } from "@/utils/validators";
import { getBookingPaymentStatusFilter, type BookingPaymentStatus } from "@/utils/currency";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/utils/pagination";
import type { IBooking } from "@/types/booking";
import type { BookingStatus } from "@/database/constants/booking-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export interface AdminBookingFilters {
  status?: BookingStatus;
  /** Derived unpaid/partially_paid/paid — filtered via getBookingPaymentStatusFilter, never a client-supplied Payment.status. */
  paymentStatus?: BookingPaymentStatus;
  /** Matches booking reference, customer name/email, or aircraft name/registration. */
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminBookingListResult {
  items: IBooking[];
  total: number;
  page: number;
  limit: number;
}

export async function getBookingsForAdmin(filters: AdminBookingFilters = {}): Promise<AdminBookingListResult> {
  await requireAdmin();
  await connectToDatabase();

  const page = filters.page && filters.page > 0 ? filters.page : DEFAULT_PAGE;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : DEFAULT_PAGE_SIZE;

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) Object.assign(query, getBookingPaymentStatusFilter(filters.paymentStatus));

  if (filters.search) {
    // Escaped for the same reason as the customer search box — an
    // unescaped pattern here is a NoSQL ReDoS vector.
    const pattern = escapeRegExp(filters.search);
    const regex = { $regex: pattern, $options: "i" };

    // Booking doesn't store customer/aircraft details itself, so a
    // name/email/registration search has to resolve matching User and
    // Aircraft ids first, then OR them in alongside a direct
    // bookingNumber match — the same two-step shape used for search
    // elsewhere in the codebase, just spanning two referenced collections
    // instead of one.
    const [matchingCustomers, matchingAircraft] = await Promise.all([
      User.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).select("_id"),
      Aircraft.find({ $or: [{ name: regex }, { model: regex }, { registration: regex }] }).select("_id"),
    ]);

    query.$or = [
      { bookingNumber: regex },
      { customer: { $in: matchingCustomers.map((c) => c._id) } },
      { aircraft: { $in: matchingAircraft.map((a) => a._id) } },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Booking.find(query)
      .populate("aircraft", "name slug category model registration")
      .populate("customer", "firstName lastName email phone company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  return { items: serialize<IBooking[]>(items), total, page, limit };
}

export async function getBookingForAdmin(bookingId: string): Promise<IBooking> {
  await requireAdmin();
  await connectToDatabase();

  const booking = await Booking.findById(bookingId)
    .populate("aircraft")
    .populate("customer", "firstName lastName email phone company")
    .populate("quote");

  if (!booking) throw new NotFoundError("Booking not found");

  return serialize<IBooking>(booking);
}
