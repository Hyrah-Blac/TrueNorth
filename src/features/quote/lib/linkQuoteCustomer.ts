import "server-only";
import connectToDatabase from "@/database/connection";
import Quote, { type QuoteDocument } from "@/database/models/Quote";
import User from "@/database/models/User";
import { AppError, NotFoundError } from "@/lib/errors/AppError";
import { QUOTE_TERMINAL_STATUSES } from "@/database/constants/quote-status";
import type { LinkQuoteCustomerInput } from "../schemas/quote.schema";

/**
 * Manually attaches an existing customer account to a quote that was
 * submitted without one (a guest request, or a signed-in request made
 * before the customer's profile existed yet). This is what backs the
 * "or link an account manually" part of approveQuoteById's error —
 * without it, an admin has no way to unblock an unlinked quote short
 * of editing Mongo directly.
 *
 * Matches by email rather than by picking from a customer list, since
 * the admin is typically working from the quote's own contactInfo.email
 * and confirming/correcting it against an existing account.
 */
export async function linkQuoteCustomer(data: LinkQuoteCustomerInput): Promise<QuoteDocument> {
  await connectToDatabase();

  const quote = await Quote.findById(data.quoteId);
  if (!quote) throw new NotFoundError("Quote not found");

  if (QUOTE_TERMINAL_STATUSES.includes(quote.status)) {
    throw new AppError(`Quote is already ${quote.status} and can no longer be edited`, 409);
  }

  if (quote.customer) {
    throw new AppError("This quote is already linked to a customer account", 409);
  }

  const user = await User.findOne({ email: data.email }).select("_id");
  if (!user) {
    throw new AppError(
      "No account found with that email. Ask the customer to sign up first, then try again.",
      404
    );
  }

  quote.customer = user._id;
  await quote.save();

  return quote;
}