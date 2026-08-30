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
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { auditLog } from "@/lib/security/audit";
import AdminNewBooking from "@/emails/AdminNewBooking";
import BookingCreated from "@/emails/BookingCreated";
import AdminQuoteAcceptanceConflict from "@/emails/AdminQuoteAcceptanceConflict";
import { CHARTER_TYPES } from "@/database/constants/charter-type";
import { claimAircraftCapacity, type AircraftCompatibilityCode } from "@/features/booking/lib/aircraftAvailability";
import { logger } from "@/lib/logging/logger";

/**
 * Fire-and-forget admin alert for a blocked quote acceptance — see the
 * catch block in acceptQuoteById below. Deliberately not awaited by its
 * caller, and swallows every error itself (network, Resend
 * misconfiguration, whatever) so a flaky/misconfigured email provider
 * can never add latency to, or break, the customer-facing failure
 * response it's reporting on.
 */
async function notifyAdminOfAcceptanceConflict(details: {
  quoteNumber: string;
  quoteId: string;
  customerName: string;
  aircraftName: string;
  reason?: string;
}): Promise<void> {
  try {
    const settings = await getSiteSettings();
    const contact = toEmailContact(settings);
    await sendEmail({
      to: getAdminNotificationEmail(),
      subject: `Action needed: quote ${details.quoteNumber} acceptance blocked`,
      react: AdminQuoteAcceptanceConflict({
        quoteNumber: details.quoteNumber,
        customerName: details.customerName,
        aircraftName: details.aircraftName,
        reason: details.reason ?? "Aircraft availability check failed at acceptance.",
        adminUrl: `${siteConfig.url}/admin/quotes/${details.quoteId}`,
        contact,
      }),
    });
  } catch (notifyError) {
    logger.error("Failed to send quote-acceptance-conflict admin alert", {
      quoteId: details.quoteId,
      error: String(notifyError),
    });
  }
}

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
 * Notification emails are all fire-and-forget after the transaction
 * commits (see sendEmail — it's best-effort and never throws), so a
 * rollback never leaves the customer/admin with an email about a
 * booking that doesn't actually exist, and a flaky email provider
 * never adds latency to the customer's response either way.
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
  // Set right before the transaction throws on a capacity/schedule
  // conflict, so the outer catch below can fire a best-effort admin
  // alert with the real internal reason — the customer only ever sees
  // the generic message thrown into the transaction (see below).
  //
  // Wrapped in a holder object rather than reassigned directly: this
  // value is only ever written inside the closure passed to
  // withTransaction below, and TypeScript's control-flow narrowing
  // doesn't track mutations made inside a nested closure — it keeps
  // treating a plain `let` here as its `null` initializer everywhere
  // outside that closure, which made the `if (conflictForAdminAlert)`
  // check in the catch block narrow to `never` and fail to compile
  // even though the assignment does happen at runtime. Reading/writing
  // a property on a `const` object isn't subject to that narrowing
  // pitfall.
  const conflictForAdminAlert: { value: { code?: AircraftCompatibilityCode; reason?: string } | null } = {
    value: null,
  };

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
            charterType: updatedQuote.charterType ?? CHARTER_TYPES.EXCLUSIVE,
            totalAmount: updatedQuote.quotedAmount,
            currency: updatedQuote.quotedCurrency,
            specialRequests: updatedQuote.specialRequests,
            status: BOOKING_STATUSES.PENDING,
          },
        ],
        { session: dbSession }
      );

      // FINAL SERVER-SIDE AVAILABILITY CHECK + ATOMIC COMMIT. The
      // pre-check at quote-approval time (approveQuoteById) is only
      // UX — this is the actual point the aircraft becomes committed,
      // inside the same transaction as the booking insert, so a
      // failure here rolls back the booking (and the quote's
      // CONVERTED flip) together rather than leaving an orphaned
      // booking with no aircraft actually available to it. See
      // aircraftAvailability.ts for the full compatibility/atomicity
      // rules — this is what makes two concurrent accepts targeting
      // the same shared flight's remaining capacity resolve safely
      // (only the claim(s) that fit within capacity succeed).
      const capacityClaim = await claimAircraftCapacity(
        {
          aircraftId: aircraft._id,
          bookingId: createdBooking._id,
          // BUG FIX: without this, claimAircraftCapacity's conflict
          // scan (which runs inside this same transaction/session,
          // and so can see the Booking.create() write immediately
          // above even though it isn't committed yet) finds the
          // booking we just created for THIS acceptance and reports
          // it back to us as a pre-existing exclusive conflict — i.e.
          // every acceptance for an exclusive charter self-rejects,
          // unconditionally, every time. See aircraftAvailability.ts's
          // AircraftAvailabilityCheckInput.bookingIdToExclude, which
          // exists for exactly this case but was never wired up here.
          bookingIdToExclude: createdBooking._id,
          origin: updatedQuote.departureAirportCode,
          destination: updatedQuote.destinationAirportCode,
          departureDate: updatedQuote.departureDate,
          departureTime: updatedQuote.departureTime,
          returnDate: updatedQuote.returnDate,
          passengerCount: updatedQuote.passengerCount,
          charterType: updatedQuote.charterType ?? CHARTER_TYPES.EXCLUSIVE,
        },
        dbSession
      );

      if (!capacityClaim.claimed) {
        // The detailed reason (which can name another customer's
        // booking number — see aircraftAvailability.ts) is for
        // ops/audit only. The customer gets a generic, actionable
        // message instead: no payment was taken, and there's a clear
        // next step. Ops is alerted separately below with the specifics.
        conflictForAdminAlert.value = { code: capacityClaim.code, reason: capacityClaim.reason };
        logger.error("Aircraft capacity claim failed at quote acceptance", {
          quoteId: String(updatedQuote._id),
          quoteNumber: updatedQuote.quoteNumber,
          aircraftId: String(aircraft._id),
          code: capacityClaim.code,
          internalReason: capacityClaim.reason,
        });
        throw new AppError(
          "This aircraft is no longer available for your requested date. No payment has been taken — please contact us and we'll arrange a different aircraft or time.",
          409,
          true,
          capacityClaim.code ?? "AIRCRAFT_UNAVAILABLE"
        );
      }

      updatedQuote.convertedBooking = createdBooking._id;
      await updatedQuote.save({ session: dbSession });

      claimed = updatedQuote;
      booking = createdBooking;
    });
  } catch (error) {
    if (conflictForAdminAlert.value) {
      // Best-effort, fire-and-forget — the customer must get their
      // response immediately regardless of how slow or broken email
      // delivery is right now. sendEmail() already retries 3x with
      // backoff internally and swallows its own failures, so simply
      // NOT awaiting it here (previous version awaited it) is enough:
      // it keeps running in the background after this function
      // returns/throws, and any failure just gets logged, never
      // surfaced or thrown into the customer-facing request.
      void notifyAdminOfAcceptanceConflict({
        quoteNumber: quote.quoteNumber,
        quoteId: String(quote._id),
        customerName: quote.contactInfo.fullName,
        aircraftName: aircraft.name,
        reason: conflictForAdminAlert.value.reason,
      });
    }
    throw error;
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
  const airportNames = await getAirportNamesByCodes([booking.departureAirportCode, booking.destinationAirportCode]);
  const departureAirportName = airportNames[booking.departureAirportCode.toUpperCase()]?.city;
  const destinationAirportName = airportNames[booking.destinationAirportCode.toUpperCase()]?.city;

  // Fire-and-forget, same reasoning as notifyAdminOfAcceptanceConflict
  // above: sendEmail() is already best-effort and never throws, but it
  // does retry 3x with backoff internally, which — with a
  // misconfigured/unverified send domain, exactly as seen in testing —
  // can add 5-10+ seconds to this response if awaited. The customer
  // has a confirmed booking at this point regardless of whether either
  // email ever lands, so there's nothing worth blocking their response
  // on here.
  void sendEmail({
    to: getAdminNotificationEmail(),
    subject: `New booking created: ${booking.bookingNumber}`,
    react: AdminNewBooking({
      bookingNumber: booking.bookingNumber,
      customerName: claimed.contactInfo.fullName,
      aircraftName: aircraft.name,
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      departureAirportName,
      destinationAirportName,
      totalAmount: formatCurrency(booking.totalAmount, booking.currency),
      adminUrl: `${siteConfig.url}/admin/bookings/${booking._id}`,
      contact,
    }),
  });

  void sendEmail({
    to: claimed.contactInfo.email,
    subject: `Booking ${booking.bookingNumber} created — payment pending`,
    react: BookingCreated({
      customerName: claimed.contactInfo.fullName,
      bookingNumber: booking.bookingNumber,
      aircraftName: aircraft.name,
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      departureAirportName,
      destinationAirportName,
      departureDate: formatDate(booking.departureDate),
      totalAmount: formatCurrency(booking.totalAmount, booking.currency),
      dashboardUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}`,
      contact,
    }),
  });

  return { quote: claimed, booking };
}