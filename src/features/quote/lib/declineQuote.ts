import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { sendEmail, getAdminNotificationEmail } from "@/lib/api/resend";
import { formatCurrency } from "@/utils/currency";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, toEmailContact } from "@/lib/config/siteSettings";
import { auditLog } from "@/lib/security/audit";
import AdminQuoteDeclined from "@/emails/AdminQuoteDeclined";

const DEFAULT_DECLINE_REASON = "Declined by the customer.";

/**
 * Customer action: declines a priced ("approved") quote. Reuses the
 * existing "rejected" status/rejectionReason field rather than adding
 * a parallel status, since a declined quote and an admin-rejected
 * quote are the same terminal outcome from the system's point of view.
 *
 * Same ownership-check-then-atomic-transition shape as acceptQuoteById,
 * for the same double-submit protection.
 */
export async function declineQuoteById(quoteId: string, reason?: string): Promise<QuoteDocument> {
  await connectToDatabase();

  const user = await getCurrentUserOrThrow();

  const quote = await Quote.findById(quoteId);
  if (!quote) throw new NotFoundError("Quote not found");

  if (!quote.customer || String(quote.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this quote");
  }

  if (quote.status !== QUOTE_STATUSES.APPROVED) {
    throw new AppError(`Quote is ${quote.status} and cannot be declined`, 409);
  }

  const claimed = await Quote.findOneAndUpdate(
    { _id: quote._id, status: QUOTE_STATUSES.APPROVED },
    {
      $set: {
        status: QUOTE_STATUSES.REJECTED,
        rejectionReason: reason?.trim() || DEFAULT_DECLINE_REASON,
      },
    },
    { new: true }
  );

  if (!claimed) {
    throw new AppError("This quote is no longer available to decline", 409);
  }

  auditLog({
    action: "quote.customer_decline",
    actorClerkId: user.clerkId,
    resourceId: String(claimed._id),
    resourceType: "quote",
    meta: { quoteNumber: claimed.quoteNumber, reason: claimed.rejectionReason },
  });

  const settings = await getSiteSettings();
  const contact = toEmailContact(settings);

  await sendEmail({
    to: getAdminNotificationEmail(),
    subject: `Quote declined: ${claimed.quoteNumber}`,
    react: AdminQuoteDeclined({
      quoteNumber: claimed.quoteNumber,
      customerName: claimed.contactInfo.fullName,
      quotedAmount: formatCurrency(claimed.quotedAmount ?? 0, claimed.quotedCurrency ?? claimed.currency),
      reason: reason?.trim() || undefined,
      adminUrl: `${siteConfig.url}/admin/quotes/${claimed._id}`,
      contact,
    }),
  });

  return claimed;
}
