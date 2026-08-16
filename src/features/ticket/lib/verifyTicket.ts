import "server-only";
import crypto from "crypto";
import connectToDatabase from "@/database/connection";
import Ticket from "@/database/models/Ticket";
import "@/database/models/Booking"; // ensure Booking schema is registered before .populate("booking") runs
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before the nested .populate("aircraft") runs
import "@/database/models/User"; // ensure User schema is registered before the nested .populate("customer") runs
import { TICKET_STATUSES } from "@/database/constants/ticket-status";
import { logger } from "@/lib/logging/logger";
import type { BookingDocument } from "@/database/models/Booking";
import type { AircraftDocument } from "@/database/models/Aircraft";

/**
 * The minimum information needed to prove "this is a valid charter
 * ticket" — deliberately excludes anything that would turn this into
 * a public booking-details page: no email, phone, payment reference,
 * M-Pesa/Paystack details, internal notes, or database ids (see Phase
 * 2 privacy requirements).
 */
export interface VerifiedTicketData {
  ticketNumber: string;
  bookingNumber: string;
  passengerName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  passengerCount: number;
  aircraftName?: string;
  aircraftRegistration?: string;
}

/**
 * Validates a raw verification token from a scanned QR / visited URL
 * and returns the sanitized, display-safe ticket data if — and only
 * if — all of the following hold:
 *
 *  1. The token's SHA-256 hash matches a stored Ticket's
 *     verificationTokenHash. This is the sole lookup mechanism here —
 *     the raw verificationToken field is never queried directly, so
 *     this route's security shape exactly matches what Phase 1
 *     established (cryptographically unpredictable credential +
 *     server-side hash validation), unchanged by Phase 2's addition
 *     of the raw-token field for redisplay purposes.
 *  2. The ticket's own status is ISSUED — not CANCELLED or
 *     INVALIDATED. A Ticket document existing is not sufficient proof
 *     of validity (Phase 2 requirement #13).
 *  3. The linked booking is still genuinely fully paid
 *     (balanceAmount <= 0), using the same authoritative
 *     paidAmount/totalAmount fields Phase 1's issuance logic already
 *     relies on — never a second, competing calculation (requirement
 *     #14). This also means a ticket automatically stops verifying if
 *     a booking were ever refunded back into an outstanding balance.
 *
 * Returns `null` for every failure case (not found, wrong status,
 * no-longer-paid) rather than distinguishing them, so an invalid scan
 * can't be used to enumerate which of those specific reasons applied
 * — the caller only ever renders a generic "INVALID TICKET" state.
 *
 * Never trust the token's mere presence/shape as proof of anything —
 * this always does a real database lookup and re-checks the current
 * state, never a cached or previously-computed result.
 */
export async function verifyTicket(rawToken: string): Promise<VerifiedTicketData | null> {
  // A malformed/empty token can't possibly match anything — short
  // circuit before touching the database.
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 32) {
    return null;
  }

  await connectToDatabase();

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const ticket = await Ticket.findOne({ verificationTokenHash: tokenHash }).populate({
    path: "booking",
    populate: [{ path: "aircraft" }, { path: "customer", select: "firstName lastName" }],
  });

  if (!ticket) {
    return null;
  }

  if (ticket.status !== TICKET_STATUSES.ISSUED) {
    logger.info("Ticket verification attempted on a non-issued ticket", {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
    });
    return null;
  }

  const booking = ticket.booking as unknown as
    | (BookingDocument & {
        aircraft?: AircraftDocument;
        customer?: { firstName?: string; lastName?: string };
      })
    | null;

  if (!booking) {
    // Shouldn't happen (a Ticket can't exist without its Booking under
    // this schema), but fail closed rather than throw if it ever does.
    logger.error("Ticket verification found a ticket with no populated booking", {
      ticketNumber: ticket.ticketNumber,
    });
    return null;
  }

  if (booking.balanceAmount > 0) {
    logger.info("Ticket verification attempted on a booking that is no longer fully paid", {
      ticketNumber: ticket.ticketNumber,
      bookingNumber: booking.bookingNumber,
    });
    return null;
  }

  const passengerName = [booking.customer?.firstName, booking.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    ticketNumber: ticket.ticketNumber,
    bookingNumber: booking.bookingNumber,
    passengerName: passengerName || "Guest",
    departureAirportCode: booking.departureAirportCode,
    destinationAirportCode: booking.destinationAirportCode,
    departureDate: booking.departureDate.toISOString(),
    passengerCount: booking.passengerCount,
    aircraftName: booking.aircraft?.name,
    aircraftRegistration: booking.aircraft?.registration,
  };
}
