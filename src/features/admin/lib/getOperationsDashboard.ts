import "server-only";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import Quote from "@/database/models/Quote";
import Payment from "@/database/models/Payment";
// Imported for its side effect only: registers the Aircraft schema with
// Mongoose so populate("aircraft") below can resolve it, the same
// reason getAnalytics.ts imports it directly (see that file for detail).
import Aircraft from "@/database/models/Aircraft";
import { requireAdmin } from "@/middleware/admin";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from "@/database/constants/booking-status";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";
import { calculateBalance } from "@/utils/currency";
import type { IBooking } from "@/types/booking";

void Aircraft;

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

const EXPIRING_WINDOW_DAYS = 7;

export interface OperationsSummary {
  pendingQuotes: number;
  approvedAwaitingDecision: number;
  expiringQuotes: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  outstandingBookingsCount: number;
  totalOutstandingBalance: number;
  upcomingFlightsCount: number;
}

/** Bookings that still owe money — same $ne cancelled + unpaid/partial shape used by Step 4's list filters. */
function outstandingBookingMatch() {
  return {
    status: { $ne: BOOKING_STATUSES.CANCELLED },
    $expr: { $lt: ["$paidAmount", "$totalAmount"] },
  };
}

export async function getOperationsSummary(): Promise<OperationsSummary> {
  await requireAdmin();
  await connectToDatabase();

  const now = new Date();
  const expiringWindowEnd = new Date(now.getTime() + EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [
    pendingQuotes,
    approvedAwaitingDecision,
    expiringQuotes,
    pendingBookings,
    confirmedBookings,
    inProgressBookings,
    completedBookings,
    outstandingAgg,
    upcomingFlightsCount,
  ] = await Promise.all([
    Quote.countDocuments({ status: { $in: [QUOTE_STATUSES.PENDING, QUOTE_STATUSES.REVIEWING] } }),
    // "Awaiting customer decision" = approved and not yet expired. The
    // expired-quote cron (Step 1) already flips these to EXPIRED, but
    // this condition is kept explicit rather than assumed, in case the
    // cron hasn't run yet for a quote whose window just closed.
    Quote.countDocuments({
      status: QUOTE_STATUSES.APPROVED,
      $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gte: now } }],
    }),
    Quote.countDocuments({
      status: QUOTE_STATUSES.APPROVED,
      validUntil: { $gte: now, $lte: expiringWindowEnd },
    }),
    Booking.countDocuments({ status: BOOKING_STATUSES.PENDING }),
    Booking.countDocuments({ status: BOOKING_STATUSES.CONFIRMED }),
    Booking.countDocuments({ status: BOOKING_STATUSES.IN_PROGRESS }),
    Booking.countDocuments({ status: BOOKING_STATUSES.COMPLETED }),
    // balanceAmount is a Mongoose virtual (totalAmount - paidAmount) and
    // can't be evaluated inside an aggregation pipeline, so the same
    // subtraction is expressed here in $subtract form — this is the
    // authoritative formula restated for Mongo, not a second balance
    // system (see calculateBalance in utils/currency.ts, which this
    // mirrors exactly).
    Booking.aggregate([
      { $match: outstandingBookingMatch() },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
        },
      },
    ]),
    Booking.countDocuments({
      departureDate: { $gte: now },
      status: { $nin: [BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.CANCELLED] },
    }),
  ]);

  return {
    pendingQuotes,
    approvedAwaitingDecision,
    expiringQuotes,
    pendingBookings,
    confirmedBookings,
    inProgressBookings,
    completedBookings,
    outstandingBookingsCount: outstandingAgg[0]?.count ?? 0,
    totalOutstandingBalance: outstandingAgg[0]?.total ?? 0,
    upcomingFlightsCount,
  };
}

export async function getUpcomingFlights(limit = 6): Promise<IBooking[]> {
  await requireAdmin();
  await connectToDatabase();

  const bookings = await Booking.find({
    departureDate: { $gte: new Date() },
    status: { $nin: [BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.CANCELLED] },
  })
    .populate("aircraft", "name model registration")
    .populate("customer", "firstName lastName email")
    .sort({ departureDate: 1 })
    .limit(limit);

  return serialize<IBooking[]>(bookings);
}

export async function getOutstandingPayments(limit = 6): Promise<IBooking[]> {
  await requireAdmin();
  await connectToDatabase();

  // balanceAmount can't be sorted on directly (it's a virtual), and a
  // $lookup-based aggregation isn't a pattern used anywhere else in
  // this codebase's admin queries. Instead: pull a bounded, indexed
  // candidate pool (most recently created unpaid/partial bookings),
  // then rank that small set in Node using calculateBalance — the same
  // formula the balanceAmount virtual uses, not a new one.
  const CANDIDATE_POOL_SIZE = 50;

  const candidates = await Booking.find(outstandingBookingMatch())
    .populate("customer", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(CANDIDATE_POOL_SIZE);

  const ranked = candidates
    .map((booking) => ({ booking, balance: calculateBalance(booking.totalAmount, booking.paidAmount) }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
    .map((entry) => entry.booking);

  return serialize<IBooking[]>(ranked);
}

export interface ActivityItem {
  id: string;
  label: string;
  reference: string;
  href: string;
  actor?: string;
  timestamp: string;
}

/**
 * A compact "what just happened" feed assembled read-only from fields
 * that already exist: Quote.reviewedAt/status, Booking.timeline (which
 * every status transition already writes to — see Step 3), and
 * Payment.status/updatedAt. This is not a new event log; it's three
 * small, indexed queries merged and sorted by timestamp.
 */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  await requireAdmin();
  await connectToDatabase();

  const [quotes, bookings, payments] = await Promise.all([
    Quote.find({ status: { $in: [QUOTE_STATUSES.APPROVED, QUOTE_STATUSES.CONVERTED, QUOTE_STATUSES.REJECTED] } })
      .select("quoteNumber status reviewedAt reviewedBy updatedAt")
      .populate("reviewedBy", "firstName lastName")
      .sort({ updatedAt: -1 })
      .limit(limit),
    Booking.find({})
      .select("bookingNumber timeline updatedAt")
      .populate("timeline.changedBy", "firstName lastName")
      .sort({ updatedAt: -1 })
      .limit(limit),
    Payment.find({ status: PAYMENT_STATUSES.COMPLETED })
      .select("paymentNumber booking updatedAt")
      .populate("booking", "bookingNumber")
      .sort({ updatedAt: -1 })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [];

  for (const quote of quotes) {
    const reviewer =
      quote.reviewedBy && typeof quote.reviewedBy === "object" && "firstName" in quote.reviewedBy
        ? `${(quote.reviewedBy as { firstName?: string }).firstName ?? ""}`.trim()
        : undefined;

    if (quote.status === QUOTE_STATUSES.APPROVED) {
      items.push({
        id: `quote-approved-${quote._id}`,
        label: "Quote approved",
        reference: quote.quoteNumber,
        href: `/admin/quotes/${quote._id}`,
        actor: reviewer,
        timestamp: (quote.reviewedAt ?? quote.updatedAt).toISOString(),
      });
    } else if (quote.status === QUOTE_STATUSES.CONVERTED) {
      items.push({
        id: `quote-accepted-${quote._id}`,
        label: "Quote accepted by customer",
        reference: quote.quoteNumber,
        href: `/admin/quotes/${quote._id}`,
        actor: "Customer",
        timestamp: quote.updatedAt.toISOString(),
      });
    } else {
      // REJECTED covers both an admin declining the initial request and
      // a customer declining a priced quote — the model doesn't record
      // which, so the actor is left unattributed rather than guessed.
      items.push({
        id: `quote-declined-${quote._id}`,
        label: "Quote declined",
        reference: quote.quoteNumber,
        href: `/admin/quotes/${quote._id}`,
        timestamp: quote.updatedAt.toISOString(),
      });
    }
  }

  for (const booking of bookings) {
    const lastEntry = booking.timeline[booking.timeline.length - 1];
    if (!lastEntry) continue;

    const changedBy =
      lastEntry.changedBy && typeof lastEntry.changedBy === "object" && "firstName" in lastEntry.changedBy
        ? `${(lastEntry.changedBy as { firstName?: string }).firstName ?? ""}`.trim()
        : undefined;

    const label =
      lastEntry.status === BOOKING_STATUSES.PENDING
        ? "Booking created"
        : `Booking ${BOOKING_STATUS_LABELS[lastEntry.status].toLowerCase()}`;

    items.push({
      id: `booking-${lastEntry.status}-${booking._id}`,
      label,
      reference: booking.bookingNumber,
      href: `/admin/bookings/${booking._id}`,
      actor: changedBy || (lastEntry.status === BOOKING_STATUSES.CONFIRMED ? "System (auto)" : undefined),
      timestamp: lastEntry.changedAt.toISOString(),
    });
  }

  for (const payment of payments) {
    const bookingRef =
      payment.booking && typeof payment.booking === "object" && "bookingNumber" in payment.booking
        ? (payment.booking as { bookingNumber?: string; _id?: unknown }).bookingNumber
        : undefined;
    const bookingId =
      payment.booking && typeof payment.booking === "object" && "_id" in payment.booking
        ? String((payment.booking as { _id?: unknown })._id)
        : String(payment.booking);

    items.push({
      id: `payment-${payment._id}`,
      label: "Payment received",
      reference: bookingRef ?? payment.paymentNumber,
      href: `/admin/bookings/${bookingId}`,
      actor: "Customer",
      timestamp: payment.updatedAt.toISOString(),
    });
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}
