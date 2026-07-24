import "server-only";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import { requireAdmin } from "@/middleware/admin";
import { NotFoundError } from "@/lib/errors/AppError";
import type { IQuote } from "@/types/quote";
import type { QuoteStatus } from "@/database/constants/quote-status";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
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
    .populate("aircraftPreference")
    .populate("customer", "firstName lastName email phone");

  if (!quote) throw new NotFoundError("Quote not found");

  return serialize<IQuote>(quote);
}
