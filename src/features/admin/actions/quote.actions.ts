"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/middleware/admin";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { approveQuoteSchema, rejectQuoteSchema, type ApproveQuoteInput, type RejectQuoteInput } from "@/features/quote/schemas/quote.schema";
import { approveQuoteById } from "@/features/quote/lib/approveQuote";
import { rejectQuoteById } from "@/features/quote/lib/rejectQuote";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function adminApproveQuote(input: ApproveQuoteInput): Promise<ActionResult<{ bookingId: string }>> {
  try {
    const session = await requireAdmin();
    const data = approveQuoteSchema.parse(input);

    const { booking } = await approveQuoteById(data, session.clerkId);

    revalidatePath("/admin/quotes");
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/quotes/${data.quoteId}`);

    return { success: true, data: { bookingId: String(booking._id) } };
  } catch (error) {
    logger.error("adminApproveQuote failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to approve quote" };
  }
}

export async function adminRejectQuote(input: RejectQuoteInput): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireAdmin();
    const data = rejectQuoteSchema.parse(input);

    const quote = await rejectQuoteById(data, session.clerkId);

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${data.quoteId}`);

    return { success: true, data: { status: quote.status } };
  } catch (error) {
    logger.error("adminRejectQuote failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to reject quote" };
  }
}
