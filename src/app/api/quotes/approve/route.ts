import type { NextRequest } from "next/server";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import Booking from "@/database/models/Booking";
import Aircraft from "@/database/models/Aircraft";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { successResponse, handleApiError } from "@/lib/api/response";
import { approveQuoteSchema } from "@/features/quote/schemas/quote.schema";
import { AppError, NotFoundError } from "@/lib/errors/AppError";
import { QUOTE_STATUSES, QUOTE_TERMINAL_STATUSES } from "@/database/constants/quote-status";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = approveQuoteSchema.parse(body);

    await connectToDatabase();

    const quote = await Quote.findById(data.quoteId);
    if (!quote) throw new NotFoundError("Quote not found");

    if (QUOTE_TERMINAL_STATUSES.includes(quote.status)) {
      throw new AppError(`Quote is already ${quote.status} and cannot be approved`, 409);
    }

    if (!quote.customer) {
      throw new AppError(
        "This quote has no linked customer account yet and cannot be converted into a booking. Ask the requester to sign in, or link an account manually.",
        409
      );
    }

    const aircraft = await Aircraft.findById(data.aircraftId);
    if (!aircraft) throw new NotFoundError("Selected aircraft not found");

    const adminDbId = await resolveDbUserId(session.clerkId);

    const booking = await Booking.create({
      quote: quote._id,
      customer: quote.customer,
      aircraft: aircraft._id,
      passengerCount: quote.passengerCount,
      departureAirportCode: quote.departureAirportCode,
      destinationAirportCode: quote.destinationAirportCode,
      departureDate: quote.departureDate,
      returnDate: quote.returnDate,
      isRoundTrip: quote.isRoundTrip,
      missionType: quote.missionType,
      totalAmount: data.quotedAmount,
      currency: data.quotedCurrency,
      specialRequests: quote.specialRequests,
      status: BOOKING_STATUSES.PENDING,
    });

    quote.status = QUOTE_STATUSES.CONVERTED;
    quote.quotedAmount = data.quotedAmount;
    quote.quotedCurrency = data.quotedCurrency;
    quote.validUntil = data.validUntil;
    quote.adminNotes = data.adminNotes ?? quote.adminNotes;
    quote.reviewedBy = adminDbId;
    quote.reviewedAt = new Date();
    quote.convertedBooking = booking._id;
    await quote.save();

    return successResponse({ quote, booking });
  } catch (error) {
    return handleApiError(error, "POST /api/quotes/approve");
  }
}
