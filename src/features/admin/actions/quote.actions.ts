"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/middleware/admin";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import {
  approveQuoteSchema,
  rejectQuoteSchema,
  linkQuoteCustomerSchema,
  type ApproveQuoteInput,
  type RejectQuoteInput,
  type LinkQuoteCustomerInput,
} from "@/features/quote/schemas/quote.schema";
import { approveQuoteById } from "@/features/quote/lib/approveQuote";
import { rejectQuoteById } from "@/features/quote/lib/rejectQuote";
import { linkQuoteCustomer } from "@/features/quote/lib/linkQuoteCustomer";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function adminApproveQuote(input: ApproveQuoteInput): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireAdmin();
    const data = approveQuoteSchema.parse(input);

    const { quote } = await approveQuoteById(data, session.clerkId);

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${data.quoteId}`);

    return { success: true, data: { status: quote.status } };
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

export async function adminLinkQuoteCustomer(
  input: LinkQuoteCustomerInput
): Promise<ActionResult<{ quoteId: string }>> {
  try {
    await requireAdmin();
    const data = linkQuoteCustomerSchema.parse(input);

    const quote = await linkQuoteCustomer(data);

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${data.quoteId}`);

    return { success: true, data: { quoteId: String(quote._id) } };
  } catch (error) {
    logger.error("adminLinkQuoteCustomer failed", { error: String(error) });
    return {
      success: false,
      error: isAppError(error) ? error.message : "Failed to link customer account",
    };
  }
}