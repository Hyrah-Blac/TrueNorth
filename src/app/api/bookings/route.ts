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
import { canAircraftAcceptBooking, claimAircraftCapacity } from "@/features/booking/lib/aircraftAvailability";
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
 * Availability is checked and the aircraft's capacity claimed the
 * same way as the quote-acceptance flow — see aircraftAvailability.ts
 * for the full compatibility rules (shared/exclusive charters, route
 * and time compatibility, passenger capacity). Both the pre-check and
 * the atomic commit run inside a single Mongo transaction alongside
 * the Booking insert, so a capacity failure rolls back the whole
 * operation instead of leaving a booking with no aircraft actually
 * committed to it. This is an internal double-booking safeguard
 * against our own records, not a claim of real-world provider
 * availability — that confirmation still happens manually, before the
 * aircraft is ever selected on a quote.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createBookingSchema.parse(body);

    await connectToDatabase();

    const availability = await canAircraftAcceptBooking({
      aircraftId: data.aircraftId,
      origin: data.departureAirportCode,
      destination: data.destinationAirportCode,
      departureDate: data.departureDate,
      departureTime: data.departureTime,
      returnDate: data.returnDate,
      passengerCount: data.passengerCount,
      charterType: data.charterType,
    });

    if (!availability.allowed) {
      throw new AppError(
        availability.reason ?? "This aircraft is not available for the selected dates",
        409,
        true,
        availability.code
      );
    }

    const dbSession = await Booking.startSession();
    let booking!: Awaited<ReturnType<typeof Booking.create>>[number];

    try {
      await dbSession.withTransaction(async () => {
        const [createdBooking] = await Booking.create(
          [
            {
              customer: data.customerId,
              aircraft: data.aircraftId,
              quote: data.quoteId,
              passengerCount: data.passengerCount,
              departureAirportCode: data.departureAirportCode,
              destinationAirportCode: data.destinationAirportCode,
              departureDate: data.departureDate,
              departureTime: data.departureTime,
              returnDate: data.returnDate,
              isRoundTrip: data.isRoundTrip,
              missionType: data.missionType,
              charterType: data.charterType,
              totalAmount: data.totalAmount,
              currency: data.currency,
              specialRequests: data.specialRequests,
            },
          ],
          { session: dbSession }
        );

        const claim = await claimAircraftCapacity(
          {
            aircraftId: data.aircraftId,
            bookingId: createdBooking._id,
            // Same fix as acceptQuote.ts — without this, the
            // just-inserted booking above is visible to the conflict
            // scan (same transaction/session) and gets reported as a
            // pre-existing conflict against itself, causing every
            // exclusive-charter booking through this endpoint to fail.
            bookingIdToExclude: createdBooking._id,
            origin: data.departureAirportCode,
            destination: data.destinationAirportCode,
            departureDate: data.departureDate,
            departureTime: data.departureTime,
            returnDate: data.returnDate,
            passengerCount: data.passengerCount,
            charterType: data.charterType,
          },
          dbSession
        );

        if (!claim.claimed) {
          throw new AppError(
            claim.reason ?? "This aircraft is not available for the selected dates",
            409,
            true,
            claim.code ?? "AIRCRAFT_UNAVAILABLE"
          );
        }

        booking = createdBooking;
      });
    } finally {
      await dbSession.endSession();
    }

    return successResponse(booking, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/bookings");
  }
}