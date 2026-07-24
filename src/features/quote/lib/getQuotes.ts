import "server-only";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { NotFoundError, ForbiddenError } from "@/lib/errors/AppError";
import type { IQuote } from "@/types/quote";
import type { QuoteStatus } from "@/database/constants/quote-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
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

  const quote = await Quote.findById(quoteId).populate("aircraftPreference");
  if (!quote) throw new NotFoundError("Quote not found");

  if (String(quote.customer) !== String(user._id)) {
    throw new ForbiddenError("You do not have access to this quote");
  }

  return serialize<IQuote>(quote);
}
