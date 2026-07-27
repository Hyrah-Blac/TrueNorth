"use server";

import { headers } from "next/headers";
import { createQuoteSchema, type CreateQuoteInput } from "../schemas/quote.schema";
import { createQuoteFromInput } from "../lib/createQuote";
import { checkRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
import { logger } from "@/lib/logging/logger";

export interface SubmitQuoteResult {
  success: boolean;
  quoteNumber?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitCharterRequest(input: CreateQuoteInput): Promise<SubmitQuoteResult> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";

    const rate = checkRateLimit(`quotes:create:${ip}`, RATE_LIMITS.PUBLIC_WRITE);
    if (!rate.allowed) {
      return { success: false, error: "Too many requests. Please wait a minute and try again." };
    }

    const parsed = createQuoteSchema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return { success: false, error: "Please check the highlighted fields.", fieldErrors };
    }

    const quote = await createQuoteFromInput(parsed.data);

    return { success: true, quoteNumber: quote.quoteNumber };
  } catch (error) {
    logger.error("submitCharterRequest failed", { error: String(error) });
    return {
      success: false,
      error: "Something went wrong submitting your request. Please try again.",
    };
  }
}