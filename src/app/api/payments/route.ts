import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import User from "@/database/models/User";
import { requireAuth, getCurrentUserOrThrow } from "@/middleware/auth";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getRequestKey, rateLimitResponse, RATE_LIMITS } from "@/middleware/rate-limit";
import { buildPaginatedResult } from "@/utils/pagination";
import { initiatePaymentSchema, paymentQuerySchema } from "@/features/payment/schemas/payment.schema";
import { initiateBookingPayment } from "@/features/payment/lib/initiatePayment";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const query = paymentQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    if (session.role !== ROLES.ADMIN) {
      const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
      filter.customer = dbUser?._id ?? null;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Payment.find(filter)
        .populate("booking", "bookingNumber departureAirportCode destinationAirportCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Payment.countDocuments(filter),
    ]);

    return successResponse(buildPaginatedResult(items, total, query.page, query.limit));
  } catch (error) {
    return handleApiError(error, "GET /api/payments");
  }
}

export async function POST(req: NextRequest) {
  try {
    // getCurrentUserOrThrow (not requireAuth) — same reasoning as the
    // initiatePayment server action: this is the route the client hits
    // to push a real M-Pesa charge, and requireAuth alone doesn't
    // check the isActive flag an admin sets via toggleUserActive.
    const user = await getCurrentUserOrThrow();

    const rate = checkRateLimit(getRequestKey(req, "payments:initiate"), RATE_LIMITS.AUTHENTICATED_WRITE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await req.json();
    const data = initiatePaymentSchema.parse(body);

    const isAdmin = user.role === ROLES.ADMIN;

    const { payment, stkResponse } = await initiateBookingPayment(
      data.bookingId,
      data.phoneNumber,
      String(user._id),
      isAdmin
    );

    return successResponse(
      {
        paymentId: payment._id,
        paymentNumber: payment.paymentNumber,
        status: payment.status,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        customerMessage: stkResponse.CustomerMessage,
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/payments");
  }
}