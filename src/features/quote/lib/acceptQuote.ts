import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import Booking, { type BookingDocument } from "@/database/models/Booking";
import Aircraft from "@/database/models/Aircraft";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { BOOKING_STATUSES } from "@/database/constants/booking-status";
import { sendEmail, getAdminNotificationEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { auditLog } from "@/lib/security/audit";
import AdminNewBooking from "@/emails/AdminNewBooking";

/**
 * Customer action: accepts a priced ("approved") quote, which is the
 * moment the booking is actually created — see approveQuote.ts for why
 * the admin's approval step no longer does this itself.
 *
 * Ownership/state are checked against a plain read first so we can
 * return an accurate error (not found / not yours / wrong status /
 * expired). The actual transition then goes through a single
 * conditional findOneAndUpdate so that two concurrent accept requests
 * (e.g. a double-click) can't both win — only one can flip the status
 * from "approved", the other gets no match and is rejected.
 */
export async function acceptQuoteById(
  quoteId: string
): Promise<{ quote: QuoteDocument; booking: BookingDocument }> {
  await connectToDatabase();

  const user = await getCurrentUserOrThrow();

  const quote = await Quote.findById(quoteId);
  if (!quote) throw new NotFoundError("Quote not found");

  if (!quote.customer || String(quote.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this quote");
  }

  if (quote.status !== QUOTE_STATUSES.APPROVED) {
    throw new AppError(`Quote is ${quote.status} and cannot be accepted`, 409);
  }

  if (quote.validUntil && quote.validUntil.getTime() < Date.now()) {
    throw new AppError("This quote has expired and can no longer be accepted", 409);
  }

  if (!quote.selectedAircraft) {
    throw new AppError("This quote is missing an assigned aircraft and cannot be accepted yet", 409);
  }

  // Atomic guard: only succeeds if the quote is still "approved" at the
  // moment of the update, preventing a double-accept race.
  const claimed = await Quote.findOneAndUpdate(
    { _id: quote._id, status: QUOTE_STATUSES.APPROVED },
    { $set: { status: QUOTE_STATUSES.CONVERTED } },
    { new: true }
  );

  if (!claimed) {
    throw new AppError("This quote is no longer available to accept", 409);
  }

  const aircraft = await Aircraft.findById(claimed.selectedAircraft);
  if (!aircraft) throw new NotFoundError("Selected aircraft not found");

  const booking = await Booking.create({
    quote: claimed._id,
    customer: claimed.customer,
    aircraft: aircraft._id,
    passengerCount: claimed.passengerCount,
    departureAirportCode: claimed.departureAirportCode,
    destinationAirportCode: claimed.destinationAirportCode,
    departureDate: claimed.departureDate,
    returnDate: claimed.returnDate,
    isRoundTrip: claimed.isRoundTrip,
    missionType: claimed.missionType,
    totalAmount: claimed.quotedAmount,
    currency: claimed.quotedCurrency,
    specialRequests: claimed.specialRequests,
    status: BOOKING_STATUSES.PENDING,
  });

  claimed.convertedBooking = booking._id;
  await claimed.save();

  auditLog({
    action: "quote.customer_accept",
    actorClerkId: user.clerkId,
    resourceId: String(claimed._id),
    resourceType: "quote",
    meta: {
      quoteNumber: claimed.quoteNumber,
      bookingId: String(booking._id),
      bookingNumber: booking.bookingNumber,
    },
  });

  const settings = await getSiteSettings();
  const contact = toEmailContact(settings);

  await sendEmail({
    to: getAdminNotificationEmail(),
    subject: `New booking created: ${booking.bookingNumber}`,
    react: AdminNewBooking({
      bookingNumber: booking.bookingNumber,
      customerName: claimed.contactInfo.fullName,
      aircraftName: aircraft.name,
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      totalAmount: formatCurrency(booking.totalAmount, booking.currency),
      adminUrl: `${siteConfig.url}/admin/bookings/${booking._id}`,
      contact,
    }),
  });

  return { quote: claimed, booking };
}
