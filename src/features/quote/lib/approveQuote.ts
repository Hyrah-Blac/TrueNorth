import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import Booking, { type BookingDocument } from "@/database/models/Booking";
import Aircraft from "@/database/models/Aircraft";
import { resolveDbUserId } from "@/middleware/auth";
import { AppError, NotFoundError } from "@/lib/errors/AppError";
import { QUOTE_STATUSES, QUOTE_TERMINAL_STATUSES } from "@/database/constants/quote-status";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { sendEmail, getAdminNotificationEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import QuoteApproved from "@/emails/QuoteApproved";
import AdminNewBooking from "@/emails/AdminNewBooking";
import type { ApproveQuoteInput } from "../schemas/quote.schema";

export async function approveQuoteById(
  data: ApproveQuoteInput,
  adminClerkId: string
): Promise<{ quote: QuoteDocument; booking: BookingDocument }> {
  await connectToDatabase();

  const quote = await Quote.findById(data.quoteId);
  if (!quote) throw new NotFoundError("Quote not found");

  if (QUOTE_TERMINAL_STATUSES.includes(quote.status)) {
    throw new AppError(`Quote is already ${quote.status} and cannot be approved`, 409);
  }

  if (!quote.customer) {
    throw new AppError(
      "This quote has no linked customer account and cannot be converted into a booking. Ask the requester to sign in, or link an account manually.",
      409
    );
  }

  const aircraft = await Aircraft.findById(data.aircraftId);
  if (!aircraft) throw new NotFoundError("Selected aircraft not found");

  const adminDbId = await resolveDbUserId(adminClerkId);

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

  await Promise.all([
    sendEmail({
      to: quote.contactInfo.email,
      subject: `Your charter quote ${quote.quoteNumber} is ready`,
      react: QuoteApproved({
        customerName: quote.contactInfo.fullName,
        quoteNumber: quote.quoteNumber,
        quotedAmount: formatCurrency(data.quotedAmount, data.quotedCurrency),
        validUntil: data.validUntil ? formatDate(data.validUntil) : undefined,
        dashboardUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
      }),
    }),
    sendEmail({
      to: getAdminNotificationEmail(),
      subject: `New booking created: ${booking.bookingNumber}`,
      react: AdminNewBooking({
        bookingNumber: booking.bookingNumber,
        customerName: quote.contactInfo.fullName,
        aircraftName: aircraft.name,
        departureAirportCode: booking.departureAirportCode,
        destinationAirportCode: booking.destinationAirportCode,
        totalAmount: formatCurrency(booking.totalAmount, booking.currency),
        adminUrl: `${siteConfig.url}/admin/bookings/${booking._id}`,
      }),
    }),
  ]);

  return { quote, booking };
}
