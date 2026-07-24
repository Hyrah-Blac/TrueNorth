import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import { resolveDbUserId } from "@/middleware/auth";
import { AppError, NotFoundError } from "@/lib/errors/AppError";
import { QUOTE_STATUSES, QUOTE_TERMINAL_STATUSES } from "@/database/constants/quote-status";
import { sendEmail } from "@/lib/api/resend";
import { siteConfig } from "@/lib/config/site";
import QuoteRejected from "@/emails/QuoteRejected";
import type { RejectQuoteInput } from "../schemas/quote.schema";

export async function rejectQuoteById(data: RejectQuoteInput, adminClerkId: string): Promise<QuoteDocument> {
  await connectToDatabase();

  const quote = await Quote.findById(data.quoteId);
  if (!quote) throw new NotFoundError("Quote not found");

  if (QUOTE_TERMINAL_STATUSES.includes(quote.status)) {
    throw new AppError(`Quote is already ${quote.status} and cannot be rejected`, 409);
  }

  const adminDbId = await resolveDbUserId(adminClerkId);

  quote.status = QUOTE_STATUSES.REJECTED;
  quote.rejectionReason = data.rejectionReason;
  quote.reviewedBy = adminDbId;
  quote.reviewedAt = new Date();
  await quote.save();

  await sendEmail({
    to: quote.contactInfo.email,
    subject: `Update on your charter request ${quote.quoteNumber}`,
    react: QuoteRejected({
      customerName: quote.contactInfo.fullName,
      quoteNumber: quote.quoteNumber,
      rejectionReason: data.rejectionReason,
      requestUrl: `${siteConfig.url}/request-charter`,
    }),
  });

  return quote;
}
