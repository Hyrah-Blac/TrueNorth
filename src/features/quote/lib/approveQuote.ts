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
import { auditLog } from "@/lib/security/audit";
import QuoteApproved from "@/emails/QuoteApproved";
import type { ApproveQuoteInput } from "../schemas/quote.schema";

/**
 * Admin action: prices a charter request and sends it to the customer
 * for review. This does NOT create a booking — the quote moves to
 * "approved" and sits there until the customer explicitly accepts it
 * (see acceptQuoteById) or declines it. This keeps the customer's
 * acceptance as the actual point of sale, matching the charter
 * lifecycle: Request -> Quote -> Customer accepts -> Booking -> Payment.
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

  const adminDbId = await resolveDbUserId(adminClerkId);

  quote.status = QUOTE_STATUSES.APPROVED;
  quote.quotedAmount = data.quotedAmount;
  quote.quotedCurrency = data.quotedCurrency;
  quote.validUntil = data.validUntil;
  quote.adminNotes = data.adminNotes ?? quote.adminNotes;
  quote.selectedAircraft = aircraft._id;
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

  await sendEmail({
    to: quote.contactInfo.email,
    subject: `Your charter quote ${quote.quoteNumber} is ready`,
    react: QuoteApproved({
      customerName: quote.contactInfo.fullName,
      quoteNumber: quote.quoteNumber,
      quotedAmount: formatCurrency(data.quotedAmount, data.quotedCurrency),
      validUntil: data.validUntil ? formatDate(data.validUntil) : undefined,
      quoteUrl: `${siteConfig.url}/dashboard/quotes/${quote._id}`,
      contact,
    }),
  });

  return { quote };
}
