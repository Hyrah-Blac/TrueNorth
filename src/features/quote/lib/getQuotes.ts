import "server-only";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import "@/database/models/Aircraft"; // ensure Aircraft schema is registered before populate runs

import { getCurrentUserOrThrow } from "@/middleware/auth";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import { getSignedAttachmentUrl } from "@/lib/api/cloudinary";
import type { IQuote } from "@/types/quote";
import type { QuoteStatus } from "@/database/constants/quote-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

/**
 * Mints a fresh signed Cloudinary URL for each attachment. Must only be
 * called after the caller's ownership check has already passed — this
 * function performs no authorization of its own, it just produces
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

export async function getMyQuotes(status?: QuoteStatus): Promise<IQuote[]> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const filter: Record<string, unknown> = { customer: user._id };
  if (status) filter.status = status;

  const quotes = await Quote.find(filter)
    .populate("aircraftPreference", "name slug category")
    .sort({ createdAt: -1 });

  return serialize<IQuote[]>(quotes);
}

export async function getMyQuoteById(quoteId: string): Promise<IQuote> {
  const user = await getCurrentUserOrThrow();
  await connectToDatabase();

  const quote = await Quote.findById(quoteId).populate("aircraftPreference").populate("selectedAircraft");
  if (!quote) throw new NotFoundError("Quote not found");

  if (String(quote.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this quote");
  }

  return withSignedAttachments(serialize<IQuote>(quote));
}
