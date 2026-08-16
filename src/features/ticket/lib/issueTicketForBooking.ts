import "server-only";
import crypto from "crypto";
import type { Types } from "mongoose";
import Booking, { type BookingDocument } from "@/database/models/Booking";
import Ticket, { type TicketDocument } from "@/database/models/Ticket";
import { TICKET_STATUSES } from "@/database/constants/ticket-status";
import { NotFoundError, AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

/** Verification tokens are 32 random bytes (256 bits) — see the rationale below. */
const VERIFICATION_TOKEN_BYTES = 32;

/**
 * Result of a successful ticket issuance call. `verificationToken` is
 * the raw token — also persisted on the Ticket document (see
 * Ticket.ts for why: it must be redisplayable for the ticket's whole
 * lifetime, not just visible once at creation). It's returned here too
 * so a caller that just created the ticket can use it immediately
 * (e.g. to build a QR code) without a second DB round-trip.
 */
export interface IssueTicketResult {
  ticket: TicketDocument;
  verificationToken?: string;
  /** True if this call created the ticket; false if one already existed. */
  created: boolean;
}

/**
 * Generates a cryptographically secure, unpredictable verification
 * token and returns both the raw token and its SHA-256 hash.
 *
 * Both are persisted (see Ticket.ts), but they serve different
 * purposes: `verificationTokenHash` is the sole source of truth for
 * the public /ticket/verify/[token] route (hash the supplied token,
 * look up by hash — the raw field is never consulted there), while
 * `verificationToken` exists only so already-authorized server code
 * (the ticket page, the PDF endpoint) can hand the same credential
 * back to its owner on demand to regenerate the QR code. Neither
 * field is ever exposed to a client directly — both are `select:
 * false` and only read by code that has already established the
 * caller is allowed to see them.
 */
function generateVerificationToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

/**
 * Issues a ticket for a fully-paid booking, or returns the existing one
 * if a ticket has already been issued for it. This is the single,
 * reusable entry point later phases (PDF/QR generation, the customer
 * ticket UI, admin tooling) should call — do not duplicate ticket
 * creation logic elsewhere.
 *
 * IDEMPOTENCY: safe to call multiple times for the same booking (e.g.
 * a duplicate M-Pesa callback or Paystack webhook retry hitting the
 * shared creditBookingAndNotify path more than once). The first call
 * creates the ticket; every subsequent call finds and returns the same
 * one. Concurrent calls are also safe: the Ticket schema's unique index
 * on `booking` is the actual guard — if two calls both pass the
 * "does a ticket exist" check before either has written (a genuine
 * race, not just sequential retries), the loser's insert fails with a
 * MongoDB E11000 duplicate-key error, which is caught here and turned
 * into "fetch and return the winner's ticket" rather than an error —
 * the same pattern already used for the User upsert race in
 * middleware/auth.ts. Exactly one ticket ever exists per booking.
 *
 * ELIGIBILITY: this function re-reads the booking's authoritative
 * paidAmount/totalAmount from the database rather than trusting the
 * caller's in-memory copy, and throws if the booking is not fully
 * paid. creditBookingAndNotify only calls this once its own booking
 * read already shows balanceAmount <= 0, so this is a defence-in-depth
 * check, not the primary gate — but it matters once later phases
 * (e.g. an admin "resend ticket" action) may call this function from
 * a different entry point where that guarantee no longer holds.
 *
 * Never trust a client-supplied "fully paid" flag here — this only
 * ever looks at the booking's own stored paidAmount/totalAmount.
 */
export async function issueTicketForBooking(
  bookingId: Types.ObjectId | string
): Promise<IssueTicketResult> {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (booking.balanceAmount > 0) {
    throw new AppError(
      `Booking ${booking.bookingNumber} is not fully paid (balance ${booking.balanceAmount}); ticket cannot be issued`,
      409
    );
  }

  const existing = await Ticket.findOne({ booking: booking._id });
  if (existing) {
    logger.info("Ticket already exists for booking — returning existing ticket", {
      bookingId: String(booking._id),
      bookingNumber: booking.bookingNumber,
      ticketNumber: existing.ticketNumber,
    });
    return { ticket: existing, created: false };
  }

  return createTicket(booking);
}

async function createTicket(booking: BookingDocument): Promise<IssueTicketResult> {
  const { token, tokenHash } = generateVerificationToken();

  logger.info("Issuing new ticket for fully paid booking", {
    bookingId: String(booking._id),
    bookingNumber: booking.bookingNumber,
  });

  try {
    const ticket = await Ticket.create({
      booking: booking._id,
      customer: booking.customer,
      status: TICKET_STATUSES.ISSUED,
      verificationToken: token,
      verificationTokenHash: tokenHash,
      issuedAt: new Date(),
    });

    logger.info("Ticket created", {
      bookingId: String(booking._id),
      bookingNumber: booking.bookingNumber,
      ticketNumber: ticket.ticketNumber,
    });

    return { ticket, verificationToken: token, created: true };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      // Another concurrent call (e.g. the M-Pesa webhook and a
      // customer-triggered "recheck payment" landing at once, both
      // reaching creditBookingAndNotify for the same booking) won the
      // race and already created the ticket between our existence
      // check and this insert. That call owns the real ticket — fetch
      // and return it instead of treating this as a failure.
      const winner = await Ticket.findOne({ booking: booking._id });
      if (winner) {
        logger.info("Concurrent ticket issuance detected — returning the winning ticket", {
          bookingId: String(booking._id),
          bookingNumber: booking.bookingNumber,
          ticketNumber: winner.ticketNumber,
        });
        return { ticket: winner, created: false };
      }
    }

    // Not a duplicate-key race, or the "winner" couldn't be found
    // (shouldn't happen, but don't mask the original error if so).
    // The caller (creditBookingAndNotify) is responsible for logging
    // this loudly and NOT treating it as a payment failure — the
    // payment has already been recorded and must not be reversed.
    // See that file for the recovery/retry rationale.
    logger.error("Ticket creation failed", {
      bookingId: String(booking._id),
      bookingNumber: booking.bookingNumber,
      error: String(error),
    });
    throw error;
  }
}
