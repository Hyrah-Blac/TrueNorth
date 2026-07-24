import "server-only";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import Quote from "@/database/models/Quote";
import Payment from "@/database/models/Payment";
import User from "@/database/models/User";
import { requireAdmin } from "@/middleware/admin";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { ROLES } from "@/database/constants/roles";
import type { IBooking } from "@/types/booking";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export interface DashboardCounts {
  pendingQuotes: number;
  pendingBookingConfirmations: number;
  pendingPayments: number;
  totalCustomers: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  await requireAdmin();
  await connectToDatabase();

  const [pendingQuotes, pendingBookingConfirmations, pendingPayments, totalCustomers] =
    await Promise.all([
      Quote.countDocuments({ status: { $in: [QUOTE_STATUSES.PENDING, QUOTE_STATUSES.REVIEWING] } }),
      Booking.countDocuments({ status: BOOKING_STATUSES.PENDING }),
      Payment.countDocuments({ status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] } }),
      User.countDocuments({ role: ROLES.CUSTOMER }),
    ]);

  return { pendingQuotes, pendingBookingConfirmations, pendingPayments, totalCustomers };
}

export interface RevenueSummary {
  totalRevenue: number;
  thisMonthRevenue: number;
  completedPaymentsCount: number;
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  await requireAdmin();
  await connectToDatabase();

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalAgg, monthAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUSES.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUSES.COMPLETED, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return {
    totalRevenue: totalAgg[0]?.total ?? 0,
    thisMonthRevenue: monthAgg[0]?.total ?? 0,
    completedPaymentsCount: totalAgg[0]?.count ?? 0,
  };
}

export interface MonthlyPoint {
  month: string;
  value: number;
}

/** Last 6 months of completed-payment revenue, oldest to newest, for the revenue chart. */
export async function getRevenueByMonth(): Promise<MonthlyPoint[]> {
  await requireAdmin();
  await connectToDatabase();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const results = await Payment.aggregate([
    { $match: { status: PAYMENT_STATUSES.COMPLETED, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return fillMonthlySeries(results, sixMonthsAgo);
}

/** Last 6 months of new customer signups, oldest to newest, for the growth chart. */
export async function getCustomerGrowth(): Promise<MonthlyPoint[]> {
  await requireAdmin();
  await connectToDatabase();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const results = await User.aggregate([
    { $match: { role: ROLES.CUSTOMER, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return fillMonthlySeries(results, sixMonthsAgo);
}

function fillMonthlySeries(
  results: { _id: { year: number; month: number }; total: number }[],
  start: Date
): MonthlyPoint[] {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const points: MonthlyPoint[] = [];

  for (let i = 0; i < 6; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const match = results.find((r) => r._id.year === date.getFullYear() && r._id.month === date.getMonth() + 1);
    points.push({ month: labels[date.getMonth()], value: match?.total ?? 0 });
  }

  return points;
}

export async function getRecentBookings(limit = 5): Promise<IBooking[]> {
  await requireAdmin();
  await connectToDatabase();

  const bookings = await Booking.find({})
    .populate("aircraft", "name category")
    .populate("customer", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(limit);

  return serialize<IBooking[]>(bookings);
}