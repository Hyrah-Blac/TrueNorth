import "server-only";
import type { Types } from "mongoose";
import Ticket, { type TicketDocument } from "@/database/models/Ticket";
import Booking from "@/database/models/Booking";
import User from "@/database/models/User";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before .populate("aircraft") runs
import type { AircraftDocument } from "@/database/models/Aircraft";
import { TICKET_EMAIL_STATUSES } from "@/database/constants/ticket-email-status";
import { generateQrCodeDataUrl } from "./generateQrCode";
import { generateTicketPdf } from "./generateTicketPdf";
import { getTicketVerificationUrl } from "./ticketVerificationUrl";
import { getTicketAirportNames } from "./getTicketAirportNames";
import { withRetry } from "@/lib/api/retry";
import { decryptToken } from "@/lib/security/tokenCipher";
import TicketConfirmation from "@/emails/TicketConfirmation";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import { logger } from "@/lib/logging/logger";

/**
 * Sends the "your charter is confirmed, here's your ticket" email —
 * the Phase 4 delivery channel that attaches the exact same PDF the
 * dashboard offers for download (generateTicketPdf, reused as-is; see
 * that file — no second PDF implementation).
 *
 * MUST be called only after a ticket genuinely exists (i.e. after
 * issueTicketForBooking has returned successfully) — see
 * creditBookingForPayment.ts for the call site and the ordering
 * rationale (never email a ticket that might not have been created).
 *
 * Idempotent and safe to call multiple times for the same ticket:
 * duplicate webhooks, retries, or two concurrent server processes all
 * converge on sending at most one email. See the atomic claim below —
 * the same findOneAndUpdate-based pattern already used for Payment
 * status transitions (see applyMpesaResult.ts).
 *
 * Never throws. A failure here (no customer email, PDF generation
 * failure, Resend outage) is recorded on the ticket and logged, but
 * must never be allowed to look like — or cause — a payment/booking/
 * ticket-issuance failure. The ticket remains fully valid and
 * available through the dashboard regardless of email outcome.
 */
export async function sendTicketConfirmationEmail(ticketId: Types.ObjectId | string): Promise<void> {
  // Atomic claim: only a ticket currently NOT_SENT or FAILED can be
  // claimed, and the findOneAndUpdate itself is the atomicity — if two
  // processes reach this at the same moment (e.g. a duplicate M-Pesa
  // callback and a customer "recheck payment" both landing on the same
  // fully-paid booking), only one of them gets back a non-null
  // `claimed` document. The other sees null and returns immediately
  // without sending anything. This is the same shape as the payment
  // claim in applyMpesaResult.ts — a plain `if (!sentAt) send()` check
  // would race here, since both processes could read "not sent" before
  // either had written.
  const claimed = await Ticket.findOneAndUpdate(
    {
      _id: ticketId,
      ticketEmailStatus: { $in: [TICKET_EMAIL_STATUSES.NOT_SENT, TICKET_EMAIL_STATUSES.FAILED] },
    },
    { $set: { ticketEmailStatus: TICKET_EMAIL_STATUSES.PENDING } },
    { new: true }
  );

  if (!claimed) {
    logger.info("Ticket confirmation email already sent or in progress — skipping", {
      ticketId: String(ticketId),
    });
    return;
  }

  try {
    await deliverTicketConfirmationEmail(claimed);
    await Ticket.findByIdAndUpdate(claimed._id, {
      $set: { ticketEmailStatus: TICKET_EMAIL_STATUSES.SENT, ticketEmailSentAt: new Date() },
      $unset: { ticketEmailLastError: "" },
    });
    logger.info("Ticket confirmation email sent", {
      ticketId: String(claimed._id),
      ticketNumber: claimed.ticketNumber,
    });
  } catch (error) {
    // The PDF/email failure itself is caught here, not re-thrown — see
    // the function doc above. The claim above already moved the
    // ticket to PENDING; this always resolves it to FAILED so a
    // future retry (a manual admin action, or simply this function
    // being called again) can pick it up again, since FAILED is one
    // of the two claimable states.
    const message = error instanceof Error ? error.message : String(error);
    await Ticket.findByIdAndUpdate(claimed._id, {
      $set: {
        ticketEmailStatus: TICKET_EMAIL_STATUSES.FAILED,
        ticketEmailFailedAt: new Date(),
        ticketEmailLastError: message.slice(0, 500),
      },
    });
    logger.error("Ticket confirmation email failed", {
      ticketId: String(claimed._id),
      ticketNumber: claimed.ticketNumber,
      error: message,
    });
  }
}

async function deliverTicketConfirmationEmail(ticket: TicketDocument): Promise<void> {
  const booking = await Booking.findById(ticket.booking).populate("aircraft");
  if (!booking) {
    throw new Error("Booking for this ticket no longer exists");
  }

  // The authoritative customer email — read from the User record, not
  // from anything the payment callback or browser supplied (Phase 4
  // requirement #7). Degrades gracefully rather than crashing if a
  // customer record is somehow missing or has no email on file
  // (requirement #20) — that's a legitimate FAILED outcome, not a bug.
  const customer = await User.findById(ticket.customer).select("firstName email");
  if (!customer || !customer.email) {
    throw new Error("Customer has no valid email address on file");
  }

  const ticketWithToken = await Ticket.findById(ticket._id).select("+verificationToken");
  if (!ticketWithToken) {
    throw new Error("Ticket disappeared before email could be sent");
  }
  // Decrypt right after fetch (FIX 7) — see tokenCipher.ts / getTicketForBooking.ts.
  ticketWithToken.verificationToken = decryptToken(ticketWithToken.verificationToken);

  const aircraft = typeof booking.aircraft === "object" ? (booking.aircraft as unknown as AircraftDocument) : undefined;
  const passengerName = customer.firstName;

  const verificationUrl = getTicketVerificationUrl(ticketWithToken.verificationToken);
  const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);
  const airportNames = await getTicketAirportNames([
    booking.departureAirportCode,
    booking.destinationAirportCode,
  ]);
  // Fetched once, up front, so both the PDF attachment and the email
  // body use the same admin-configured contact info (Settings >
  // General) rather than the hardcoded fallback in site.ts.
  const settings = await getSiteSettings();

  // Reuses the exact same PDF generator as the dashboard download
  // route (Phase 2) — see generateTicketPdf.tsx. Not a second PDF
  // implementation; the attachment is byte-for-byte what the customer
  // would get clicking "Download Ticket" in the dashboard.
  const pdfBuffer = await generateTicketPdf({
    ticketNumber: ticketWithToken.ticketNumber,
    bookingNumber: booking.bookingNumber,
    passengerName,
    departureAirportCode: booking.departureAirportCode,
    destinationAirportCode: booking.destinationAirportCode,
    departureDate: booking.departureDate,
    passengerCount: booking.passengerCount,
    aircraftName: aircraft?.name,
    aircraftRegistration: aircraft?.registration,
    qrCodeDataUrl,
    verificationUrl,
    status: ticketWithToken.status,
    departureTime: booking.departureTime,
    fboName: booking.fboName,
    fboAddress: booking.fboAddress,
    departureAirportName: airportNames[booking.departureAirportCode.toUpperCase()],
    destinationAirportName: airportNames[booking.destinationAirportCode.toUpperCase()],
    companyName: settings.companyName,
    contactPhone: settings.phone,
    contactEmail: settings.email,
  });

  await sendEmailWithAttachment({
    to: customer.email,
    subject: `Your Charter is Confirmed — Ticket ${ticketWithToken.ticketNumber}`,
    react: TicketConfirmation({
      customerName: customer.firstName,
      ticketNumber: ticketWithToken.ticketNumber,
      bookingNumber: booking.bookingNumber,
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      departureAirportName: airportNames[booking.departureAirportCode.toUpperCase()],
      destinationAirportName: airportNames[booking.destinationAirportCode.toUpperCase()],
      departureDate: formatDate(booking.departureDate),
      passengerCount: booking.passengerCount,
      aircraftName: aircraft?.name,
      amountPaid: formatCurrency(booking.totalAmount, booking.currency),
      viewTicketUrl: `${siteConfig.url}/dashboard/bookings/${booking._id}/ticket`,
      downloadTicketUrl: `${siteConfig.url}/api/tickets/${ticketWithToken._id}/pdf`,
      contact: toEmailContact(settings),
    }),
    attachment: { filename: `${ticketWithToken.ticketNumber}.pdf`, content: pdfBuffer },
  });
}

/**
 * The shared sendEmail() helper (lib/api/resend.ts) doesn't take
 * attachments — nothing before Phase 4 needed to send one. Rather
 * than widen that shared helper's signature for every caller, this
 * calls Resend directly (with the same retry-on-transient-failure
 * behavior via withRetry) scoped to this one use. If a second
 * attachment-sending email shows up in a later phase, promoting this
 * into lib/api/resend.ts would be the right move — not duplicating it
 * a second time. Unlike sendEmail, this deliberately does NOT swallow
 * the error itself — the caller (sendTicketConfirmationEmail) needs
 * the throw to record the FAILED state on the ticket.
 */
async function sendEmailWithAttachment(params: {
  to: string;
  subject: string;
  react: ReturnType<typeof TicketConfirmation>;
  attachment: { filename: string; content: Buffer };
}): Promise<void> {
  const { Resend } = await import("resend");

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not configured");

  const resend = new Resend(apiKey);

  await withRetry(
    async () => {
      const { error } = await resend.emails.send({
        from: `${siteConfig.name} <${fromEmail}>`,
        to: params.to,
        subject: params.subject,
        react: params.react,
        attachments: [{ filename: params.attachment.filename, content: params.attachment.content }],
      });

      if (error) {
        throw new Error(JSON.stringify(error));
      }
    },
    { attempts: 3, baseDelayMs: 500, label: `ticket email (${params.subject})` }
  );
}