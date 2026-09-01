"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/middleware/auth";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import {
  acceptQuoteSchema,
  declineQuoteSchema,
  type AcceptQuoteInput,
  type DeclineQuoteInput,
} from "@/features/quote/schemas/quote.schema";
import { acceptQuoteById } from "@/features/quote/lib/acceptQuote";
import { declineQuoteById } from "@/features/quote/lib/declineQuote";

type ActionResult<T> =
  | { success: true; data: T }
  // `code` is the optional AppError.code (e.g. "AIRCRAFT_UNAVAILABLE") —
  // present only for the aircraft-availability family of failures, so
  // the UI can offer a "contact us" next step without string-matching
  // the human-readable message.
  | { success: false; error: string; code?: string };

export async function customerAcceptQuote(
  input: AcceptQuoteInput
): Promise<ActionResult<{ status: string; bookingId: string }>> {
  try {
    // requireAuth() re-checks the session server-side — the quote/customer
    // ownership check itself happens inside acceptQuoteById, which never
    // trusts anything about the caller beyond their authenticated identity.
    await requireAuth();
    const data = acceptQuoteSchema.parse(input);

    const { quote, booking } = await acceptQuoteById(data.quoteId);

    revalidatePath("/dashboard/quotes");
    revalidatePath(`/dashboard/quotes/${data.quoteId}`);
    revalidatePath("/dashboard/bookings");

    return { success: true, data: { status: quote.status, bookingId: String(booking._id) } };
  } catch (error) {
    logger.error("customerAcceptQuote failed", { error: String(error) });
    return {
      success: false,
      error: isAppError(error) ? error.message : "Failed to accept quote",
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function customerDeclineQuote(
  input: DeclineQuoteInput
): Promise<ActionResult<{ status: string }>> {
  try {
    await requireAuth();
    const data = declineQuoteSchema.parse(input);

    const quote = await declineQuoteById(data.quoteId, data.reason);

    revalidatePath("/dashboard/quotes");
    revalidatePath(`/dashboard/quotes/${data.quoteId}`);

    return { success: true, data: { status: quote.status } };
  } catch (error) {
    logger.error("customerDeclineQuote failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to decline quote" };
  }
}