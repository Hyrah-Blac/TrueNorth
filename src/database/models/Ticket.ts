import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import {
  TICKET_STATUS_VALUES,
  TICKET_STATUSES,
  type TicketStatus,
} from "../constants/ticket-status";
import {
  TICKET_EMAIL_STATUS_VALUES,
  TICKET_EMAIL_STATUSES,
  type TicketEmailStatus,
} from "../constants/ticket-email-status";
import { getNextSequence } from "./Counter";

export interface TicketDocument extends Document {
  ticketNumber: string;
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  status: TicketStatus;

  // The SHA-256 hash of the verification token — the source of truth
  // for the public /ticket/verify/[token] lookup (see
  // issueTicketForBooking.ts and verifyTicket.ts). Excluded from
  // default query projections (`select: false`) so a normal
  // `Ticket.find()`/`findById()` never accidentally pulls it into a
  // response payload; callers that genuinely need it must opt in with
  // `.select("+verificationTokenHash")`.
  verificationTokenHash: string;

  // The raw verification token, added in Phase 2. A ticket's QR code
  // has to be redisplayed on demand — every dashboard visit, every PDF
  // re-download, every reprint — unlike a one-time password-reset
  // token that's shown once and then only ever compared against.
  // That's a genuine functional requirement, not an oversight: without
  // storing the raw value there would be no way to render the QR again
  // after the moment of issuance. It's still excluded from default
  // query projections for the same reason as the hash, and the public
  // verification lookup deliberately continues to go through
  // `verificationTokenHash` rather than this field, so that codepath's
  // security shape (hash the supplied token, look up by hash) is
  // unchanged from Phase 1. This field is only ever read by
  // already-authorized server code that needs to hand the token back
  // to its owner (the ticket page, the PDF endpoint) — never by the
  // public verification route.
  verificationToken: string;

  issuedAt: Date;
  cancelledAt?: Date;
  invalidatedAt?: Date;

  // Phase 4 — tracks delivery of the "your charter is confirmed, here's
  // your ticket" email (see sendTicketConfirmationEmail.ts). Kept on the
  // Ticket itself, rather than a separate collection, since there is
  // exactly one such email per ticket and the ticket is already the
  // natural place other issuance-adjacent state lives (issuedAt, etc).
  // `pending` exists specifically as the atomic-claim state: a process
  // moves a ticket from not_sent/failed into pending before it starts
  // work, so a second concurrent process (e.g. a duplicate webhook
  // reaching creditBookingAndNotify again) sees pending and does not
  // also attempt to send — see sendTicketConfirmationEmail.ts for the
  // claim itself.
  ticketEmailStatus: TicketEmailStatus;
  ticketEmailSentAt?: Date;
  ticketEmailFailedAt?: Date;
  // Deliberately short and provider-agnostic — never the raw error
  // object/stack from Resend or react-pdf, both to avoid leaking
  // internal detail and to keep this field small (same rationale as
  // Payment.failureReason's maxlength).
  ticketEmailLastError?: string;

  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<TicketDocument>(
  {
    ticketNumber: { type: String, unique: true, index: true },

    // One ticket per booking for this phase — see issueTicketForBooking.ts
    // for the business-rule rationale. `unique: true` is the DB-level
    // backstop behind the service's own idempotency check: even if the
    // service is ever called twice concurrently for the same booking,
    // Mongo itself rejects the second insert instead of silently
    // creating a duplicate ticket.
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    status: {
      type: String,
      enum: TICKET_STATUS_VALUES,
      default: TICKET_STATUSES.ISSUED,
      index: true,
    },

    verificationTokenHash: { type: String, required: true, unique: true, select: false },
    verificationToken: { type: String, required: true, unique: true, select: false },

    issuedAt: { type: Date, default: () => new Date() },
    cancelledAt: { type: Date },
    invalidatedAt: { type: Date },

    ticketEmailStatus: {
      type: String,
      enum: TICKET_EMAIL_STATUS_VALUES,
      default: TICKET_EMAIL_STATUSES.NOT_SENT,
      index: true,
    },
    ticketEmailSentAt: { type: Date },
    ticketEmailFailedAt: { type: Date },
    ticketEmailLastError: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Generates human-readable, day-scoped ticket numbers, e.g. TN-20260718-0001,
// using the same atomic per-day counter as booking/payment numbers (see
// Counter.ts) so concurrent ticket creation can't collide. Uses its own
// counter key ("ticket-<date>"), independent of the booking/payment
// sequences, so ticket numbering stays internally consistent even though
// it doesn't necessarily line up 1:1 with booking or payment numbers.
TicketSchema.pre("validate", async function (this: TicketDocument, next) {
  if (this.ticketNumber) return next();

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sequence = await getNextSequence(`ticket-${datePart}`);
  this.ticketNumber = `TN-${datePart}-${String(sequence).padStart(4, "0")}`;

  next();
});

export const Ticket: Model<TicketDocument> =
  models.Ticket || model<TicketDocument>("Ticket", TicketSchema);

export default Ticket;
