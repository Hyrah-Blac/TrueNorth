import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import Aircraft from "@/database/models/Aircraft";
import { resolveDbUserId } from "@/middleware/auth";
import { AppError, NotFoundError } from "@/lib/errors/AppError";
import { QUOTE_STATUSES, QUOTE_TERMINAL_STATUSES } from "@/database/constants/quote-status";
import { sendEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { auditLog } from "@/lib/security/audit";
import QuoteApproved from "@/emails/QuoteApproved";
import type { ApproveQuoteInput } from "../schemas/quote.schema";
import { canAircraftAcceptBooking, findConflictingApprovedQuote } from "@/features/booking/lib/aircraftAvailability";

/**
 * Admin action: prices a charter request and sends it to the customer
 * for review. This does NOT create a booking — the quote moves to
 * "approved" and sits there until the customer explicitly accepts it
 * (see acceptQuoteById) or declines it. This keeps the customer's
 * acceptance as the actual point of sale, matching the charter
 * lifecycle: Request -> Quote -> Customer accepts -> Booking -> Payment.
 *
 * Departure time is collected here too, alongside the aircraft
 * (data.departureTime — optional, since it isn't always known yet).
 * It's carried onto the Booking at acceptance (see acceptQuote.ts) so
 * a customer who pays and is taken straight to their ticket already
 * sees a time, rather than it only being added by ops afterwards.
 * data.departureDate is optional too, defaulting to the customer's
 * originally requested date in the dialog — only actually overwrites
 * quote.departureDate when the admin explicitly changes it.
 */
export async function approveQuoteById(
  data: ApproveQuoteInput,
  adminClerkId: string
): Promise<{ quote: QuoteDocument }> {
  await connectToDatabase();

  const quote = await Quote.findById(data.quoteId);
  if (!quote) throw new NotFoundError("Quote not found");

  if (QUOTE_TERMINAL_STATUSES.includes(quote.status)) {
    throw new AppError(`Quote is already ${quote.status} and cannot be approved`, 409);
  }

  if (!quote.customer) {
    throw new AppError(
      "This quote has no linked customer account and cannot be sent for a decision. Ask the requester to sign in, or link an account manually.",
      409
    );
  }

  const aircraft = await Aircraft.findById(data.aircraftId);
  if (!aircraft) throw new NotFoundError("Selected aircraft not found");

  // Early availability pre-check (good UX — catch an obviously bad
  // aircraft assignment before the customer is even sent a quote to
  // accept). This is NOT the atomic guarantee: the real, race-safe
  // capacity commit happens at acceptQuoteById when the booking is
  // actually created — see aircraftAvailability.ts. An admin
  // re-approving the same quote (bookingIdToExclude not applicable
  // here, since no booking exists yet) always re-checks against
  // current data.
  const effectiveDepartureDate = data.departureDate ?? quote.departureDate;
  const availability = await canAircraftAcceptBooking({
    aircraftId: aircraft._id,
    origin: quote.departureAirportCode,
    destination: quote.destinationAirportCode,
    departureDate: effectiveDepartureDate,
    departureTime: data.departureTime,
    returnDate: quote.returnDate,
    passengerCount: quote.passengerCount,
    charterType: data.charterType,
  });

  if (!availability.allowed) {
    throw new AppError(
      availability.reason ?? "This aircraft is not available for the selected flight",
      409,
      true,
      availability.code
    );
  }

  // Second half of the pre-check: catch this same aircraft/slot
  // already being promised to a DIFFERENT quote that's still sitting
  // in "approved" awaiting its own customer's decision. Bookings-only
  // checks (above) can't see this, since neither quote has become a
  // Booking yet — see findConflictingApprovedQuote for why this
  // matters (two customers can otherwise both be sent a valid-looking
  // quote for the same exclusive aircraft slot, and only the first to
  // accept actually gets it).
  const quoteConflict = await findConflictingApprovedQuote({
    aircraftId: aircraft._id,
    origin: quote.departureAirportCode,
    destination: quote.destinationAirportCode,
    departureDate: effectiveDepartureDate,
    departureTime: data.departureTime,
    returnDate: quote.returnDate,
    passengerCount: quote.passengerCount,
    charterType: data.charterType,
    quoteIdToExclude: quote._id,
  });

  if (!quoteConflict.allowed) {
    throw new AppError(
      quoteConflict.reason ?? "This aircraft is already promised to another approved quote for this slot",
      409,
      true,
      quoteConflict.code
    );
  }

  const adminDbId = await resolveDbUserId(adminClerkId);

  quote.status = QUOTE_STATUSES.APPROVED;
  quote.quotedAmount = data.quotedAmount;
  quote.quotedCurrency = data.quotedCurrency;
  quote.validUntil = data.validUntil;
  quote.adminNotes = data.adminNotes ?? quote.adminNotes;
  quote.selectedAircraft = aircraft._id;
  quote.departureDate = effectiveDepartureDate;
  quote.departureTime = data.departureTime;
  quote.charterType = data.charterType;
  quote.reviewedBy = adminDbId;
  quote.reviewedAt = new Date();
  await quote.save();

  auditLog({
    action: "quote.approve",
    actorClerkId: adminClerkId,
    resourceId: String(quote._id),
    resourceType: "quote",
    meta: {
      quoteNumber: quote.quoteNumber,
      aircraftId: String(aircraft._id),
      quotedAmount: data.quotedAmount,
      quotedCurrency: data.quotedCurrency,
    },
  });

  const settings = await getSiteSettings();
  const contact = toEmailContact(settings);
  const airportNames = await getAirportNamesByCodes([quote.departureAirportCode, quote.destinationAirportCode]);

  // Fire-and-forget — see the same fix/reasoning in acceptQuote.ts.
  // sendEmail() is already best-effort internally (retries 3x, never
  // throws), so awaiting it here only risks adding several seconds of
  // latency to the admin's approval action for no benefit — the quote
  // is already approved and saved regardless of whether this email
  // lands.
  void sendEmail({
    to: quote.contactInfo.email,
    subject: `Your charter quote ${quote.quoteNumber} is ready`,
    react: QuoteApproved({
      customerName: quote.contactInfo.fullName,
      quoteNumber: quote.quoteNumber,
      departureAirportCode: quote.departureAirportCode,
      destinationAirportCode: quote.destinationAirportCode,
      departureAirportName: airportNames[quote.departureAirportCode.toUpperCase()]?.city,
      destinationAirportName: airportNames[quote.destinationAirportCode.toUpperCase()]?.city,
      quotedAmount: formatCurrency(data.quotedAmount, data.quotedCurrency),
      departureDate: formatDate(quote.departureDate),
      departureTime: quote.departureTime,
      validUntil: data.validUntil ? formatDate(data.validUntil) : undefined,
      quoteUrl: `${siteConfig.url}/dashboard/quotes/${quote._id}`,
      contact,
    }),
  });

  return { quote };
}