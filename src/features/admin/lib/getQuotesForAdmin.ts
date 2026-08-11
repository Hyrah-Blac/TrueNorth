import "server-only";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before populate runs

import { requireAdmin } from "@/middleware/admin";
import { NotFoundError } from "@/lib/errors/AppError";
import { getSignedAttachmentUrl } from "@/lib/api/cloudinary";
import type { IQuote } from "@/types/quote";
import type { QuoteStatus } from "@/database/constants/quote-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

/**
 * Mints a fresh signed Cloudinary URL for each attachment. Must only be
 * called after the caller's admin/ownership check has already passed —
 * this function performs no authorization of its own, it just produces
 * short-lived URLs for whoever already has the right to see them.
 */
function withSignedAttachments(quote: IQuote): IQuote {
  return {
    ...quote,
    attachments: quote.attachments.map((attachment) => ({
      ...attachment,
      viewUrl: getSignedAttachmentUrl(attachment.publicId, attachment.resourceType),
    })),
  };
}

export async function getQuotesForAdmin(status?: QuoteStatus): Promise<IQuote[]> {
  await requireAdmin();
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const quotes = await Quote.find(filter)
    .populate("aircraftPreference", "name slug category")
    .populate("customer", "firstName lastName email")
    .sort({ createdAt: -1 });

  return serialize<IQuote[]>(quotes);
}

export async function getQuoteForAdmin(quoteId: string): Promise<IQuote> {
  await requireAdmin();
  await connectToDatabase();

  const quote = await Quote.findById(quoteId)
    .populate("aircraftPreference", "name slug category registration manufacturer model")
    .populate("customer", "firstName lastName email phone")
    .populate("reviewedBy", "firstName lastName email");

  if (!quote) throw new NotFoundError("Quote not found");

  return withSignedAttachments(serialize<IQuote>(quote));
}