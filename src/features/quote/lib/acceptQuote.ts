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
import { formatDate } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { auditLog } from "@/lib/security/audit";
import AdminNewBooking from "@/emails/AdminNewBooking";
import BookingCreated from "@/emails/BookingCreated";

/**
 * Customer action: accepts a priced ("approved") quote, which is the
 * moment the booking is actually created — see approveQuote.ts for why
 * the admin's approval step no longer does this itself.
 *
 * departureTime is copied straight across from the quote (set by the
 * admin at approval, alongside the aircraft) rather than being left
 * for ops to add later — see BookingTripDetailsActions.tsx, which now
 * exists for adjustments rather than first entry. This means a
 * customer who pays and is redirected straight to their ticket
 * already sees a departure time whenever the admin knew it upfront.
 *
 * Ownership/state are checked against a plain read first so we can
 * return an accurate error (not found / not yours / wrong status /
 * expired). The actual transition then goes through a conditional
 * findOneAndUpdate so that two concurrent accept requests (e.g. a
 * double-click) can't both win — only one can flip the status from
 * "approved", the other gets no match and is rejected.
 *
 * The quote-claim and the booking creation run inside a single Mongo
 * session/transaction (Atlas replica set, so transactions are
 * available — see connection.ts). Without this, a Booking.create()
 * failure after the quote was already flipped to CONVERTED would
 * leave a CONVERTED quote with no booking behind it, and there'd be
 * no way for the customer to pay or for the admin to recover cleanly.
 * The Booking schema's unique index on `quote` is a second, DB-level
 * backstop against ever creating two bookings for the same quote.
 * Notification emails are sent only after the transaction commits,
 * so a rollback never leaves the customer/admin with an email about
 * a booking that doesn't actually exist.
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

  const aircraft = await Aircraft.findById(quote.selectedAircraft);
  if (!aircraft) throw new NotFoundError("Selected aircraft not found");

  const dbSession = await Quote.startSession();
  let claimed!: QuoteDocument;
  let booking!: BookingDocument;

  try {
    await dbSession.withTransaction(async () => {
      // Atomic guard: only succeeds if the quote is still "approved" at
      // the moment of the update, preventing a double-accept race.
      const updatedQuote = await Quote.findOneAndUpdate(
        { _id: quote._id, status: QUOTE_STATUSES.APPROVED },
        { $set: { status: QUOTE_STATUSES.CONVERTED } },
        { new: true, session: dbSession }
      );

      if (!updatedQuote) {
        throw new AppError("This quote is no longer available to accept", 409);
      }

      const [createdBooking] = await Booking.create(
        [
          {
            quote: updatedQuote._id,
            customer: updatedQuote.customer,
            aircraft: aircraft._id,
            passengerCount: updatedQuote.passengerCount,
            departureAirportCode: updatedQuote.departureAirportCode,
            destinationAirportCode: updatedQuote.destinationAirportCode,
            departureDate: updatedQuote.departureDate,
            departureTime: updatedQuote.departureTime,
            returnDate: updatedQuote.returnDate,
            isRoundTrip: updatedQuote.isRoundTrip,
            missionType: updatedQuote.missionType,
            totalAmount: updatedQuote.quotedAmount,
            currency: updatedQuote.quotedCurrency,
            specialRequests: updatedQuote.specialRequests,
            status: BOOKING_STATUSES.PENDING,
          },
        ],
        { session: dbSession }
      );

      updatedQuote.convertedBooking = createdBooking._id;
      await updatedQuote.save({ session: dbSession });

      claimed = updatedQuote;
      booking = createdBooking;
    });
  } finally {
    await dbSession.endSession();
  }

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

  await sendEmail({
    to: claimed.contactInfo.email,
    subject: `Booking ${booking.bookingNumber} created — payment pending`,
    react: BookingCreated({
      customerName: claimed.contactInfo.fullName,
      bookingNumber: booking.bookingNumber,
      aircraftName: aircraft.name,
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      departureDate: formatDate(booking.departureDate),
      totalAmount: formatCurrency(booking.totalAmount, booking.currency),
      dashboardUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
      contact,
    }),
  });

  return { quote: claimed, booking };
}