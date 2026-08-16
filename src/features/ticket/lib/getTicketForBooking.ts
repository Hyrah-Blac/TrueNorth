import "server-only";
import type { Types } from "mongoose";
import connectToDatabase from "@/database/connection";
import Booking, { type BookingDocument } from "@/database/models/Booking";
import Ticket, { type TicketDocument } from "@/database/models/Ticket";
import type { AircraftDocument } from "@/database/models/Aircraft";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before .populate("aircraft") runs
import { getCurrentUserOrThrow } from "@/middleware/auth";
import type { UserDocument } from "@/database/models/User";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";

/**
 * BookingDocument with `aircraft` narrowed to reflect that every
 * lookup below always calls `.populate("aircraft")` — mirrors the
 * `aircraft: string | IAircraft` union already used by IBooking (see
 * types/booking.ts) for the same reason, just kept as a live Mongoose
 * document here (with real Date fields) rather than the
 * JSON-serialized plain object IBooking represents, since the ticket
 * page and PDF route need `booking.departureDate.toISOString()` to
 * work directly.
 */
export type BookingWithPopulatedAircraft = Omit<BookingDocument, "aircraft"> & {
  aircraft: Types.ObjectId | AircraftDocument;
};

export interface OwnedTicket {
  booking: BookingWithPopulatedAircraft;
  /** The authenticated caller — always equal to booking.customer once ownership is verified below, so this is simply reused as the passenger's display name rather than re-fetched via populate. */
  customer: Pick<UserDocument, "firstName" | "lastName">;
  /** `null` when the booking exists and belongs to the caller but no ticket has been issued for it yet (e.g. not fully paid). */
  ticket: TicketDocument | null;
}

/** Same shape as OwnedTicket, but `ticket` is guaranteed non-null — used by
 * getMyTicketById, which only ever returns after finding a real ticket
 * document (see below). Keeping this as a distinct type (rather than a
 * non-null assertion at every call site) means callers like the PDF route
 * get a compile-time guarantee, not just a runtime one. */
export interface OwnedTicketWithTicket extends OwnedTicket {
  ticket: TicketDocument;
}

/**
 * Cheap existence check for whether a booking already has a ticket,
 * with no auth of its own — the caller (e.g. the booking detail page)
 * has already established ownership of the booking via its own
 * getMyBookingById call, so this just answers "is there a ticket to
 * link to" without repeating that check or over-fetching.
 */
export async function ticketExistsForBooking(bookingId: string): Promise<boolean> {
  await connectToDatabase();
  const match = await Ticket.exists({ booking: bookingId });
  return Boolean(match);
}

/**
 * Batch version of ticketExistsForBooking, for list views (the
 * dashboard overview, the bookings list) that render several
 * BookingCards at once and would otherwise issue one query per card.
 * Returns a Set of booking id strings that have an issued ticket —
 * membership check only, no ticket data, since cards only need to
 * know whether to show a "View Ticket" link.
 */
export async function getBookingIdsWithTickets(bookingIds: (Types.ObjectId | string)[]): Promise<Set<string>> {
  if (bookingIds.length === 0) return new Set();
  await connectToDatabase();
  const tickets = await Ticket.find({ booking: { $in: bookingIds } }, { booking: 1 });
  return new Set(tickets.map((t) => String(t.booking)));
}

/**
 * Resolves a booking's ticket for the currently signed-in customer,
 * enforcing the same ownership rule as getMyBookingById (see
 * features/booking/lib/getBookings.ts): a booking that exists but
 * belongs to someone else throws ForbiddenError, not NotFoundError, so
 * the UI can tell "wrong account" apart from "doesn't exist" — same
 * distinction already used across the dashboard (see WrongAccountNotice).
 *
 * Deliberately does NOT select verificationToken/verificationTokenHash
 * by default — callers that need the raw token to render a QR code
 * (the ticket page, the PDF route) must ask for it explicitly via
 * `includeVerificationToken`, keeping the "who can see the raw
 * credential" surface as small and intentional as possible.
 */
export async function getMyTicketForBooking(
  bookingId: string,
  options: { includeVerificationToken?: boolean } = {}
): Promise<OwnedTicket> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  // Deliberately NOT populating "customer" here — the ownership check
  // right below needs booking.customer as a raw ObjectId to compare
  // against user._id. The authenticated `user` we already have IS the
  // customer once that check passes, so it's reused directly as the
  // display name below instead of being re-fetched via populate.
  const booking = await Booking.findById(bookingId).populate("aircraft");
  if (!booking) throw new NotFoundError("Booking not found");

  if (String(booking.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this booking");
  }

  const ticket = options.includeVerificationToken
    ? await Ticket.findOne({ booking: booking._id }).select("+verificationToken")
    : await Ticket.findOne({ booking: booking._id });

  return {
    booking: booking as unknown as BookingWithPopulatedAircraft,
    customer: { firstName: user.firstName, lastName: user.lastName },
    ticket,
  };
}

/**
 * Same ownership/lookup shape as getMyTicketForBooking, but keyed by
 * ticket id instead of booking id — used by the PDF download route,
 * whose URL is /api/tickets/[ticketId]/pdf. Always includes the raw
 * verification token since the PDF needs it to render the QR code.
 */
export async function getMyTicketById(ticketId: string): Promise<OwnedTicketWithTicket> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const ticket = await Ticket.findById(ticketId).select("+verificationToken");
  if (!ticket) throw new NotFoundError("Ticket not found");

  const booking = await Booking.findById(ticket.booking).populate("aircraft");
  if (!booking) throw new NotFoundError("Booking not found");

  if (String(booking.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this ticket");
  }

  return {
    booking: booking as unknown as BookingWithPopulatedAircraft,
    customer: { firstName: user.firstName, lastName: user.lastName },
    ticket,
  };
}
