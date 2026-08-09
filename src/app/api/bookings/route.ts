import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Booking from "@/database/models/Booking";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before populate runs

import User from "@/database/models/User";
import { requireAuth } from "@/middleware/auth";
import { requireAdmin } from "@/middleware/admin";
import { ROLES } from "@/database/constants/roles";
import { successResponse, handleApiError } from "@/lib/api/response";
import { buildPaginatedResult } from "@/utils/pagination";
import { bookingQuerySchema, createBookingSchema } from "@/features/booking/schemas/booking.schema";
import { checkAircraftAvailability } from "@/features/booking/lib/transitions";
import { AppError } from "@/lib/errors/AppError";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const query = bookingQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    if (session.role !== ROLES.ADMIN) {
      const dbUser = await User.findOne({ clerkId: session.clerkId }).select("_id");
      filter.customer = dbUser?._id ?? null;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate("aircraft", "name slug category heroImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Booking.countDocuments(filter),
    ]);

    return successResponse(buildPaginatedResult(items, total, query.page, query.limit));
  } catch (error) {
    return handleApiError(error, "GET /api/bookings");
  }
}

/**
 * Admin-only direct booking creation, for cases outside the normal
 * quote flow (e.g. a phone-in charter booked without ever going
 * through a quote). Most bookings are instead created automatically
 * when a customer accepts their quote — see acceptQuoteById.
 *
 * The availability check here is an internal double-booking safeguard
 * (is this aircraft already tied to another active booking in our own
 * records) — not a claim of real-world provider availability. That
 * confirmation happens manually, before the aircraft is ever selected
 * on a quote.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createBookingSchema.parse(body);

    await connectToDatabase();

    const { available } = await checkAircraftAvailability(
      data.aircraftId,
      data.departureDate,
      data.returnDate
    );

    if (!available) {
      throw new AppError("This aircraft is not available for the selected dates", 409);
    }

    const booking = await Booking.create({
      customer: data.customerId,
      aircraft: data.aircraftId,
      quote: data.quoteId,
      passengerCount: data.passengerCount,
      departureAirportCode: data.departureAirportCode,
      destinationAirportCode: data.destinationAirportCode,
      departureDate: data.departureDate,
      returnDate: data.returnDate,
      isRoundTrip: data.isRoundTrip,
      missionType: data.missionType,
      totalAmount: data.totalAmount,
      currency: data.currency,
      specialRequests: data.specialRequests,
    });

    return successResponse(booking, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/bookings");
  }
}