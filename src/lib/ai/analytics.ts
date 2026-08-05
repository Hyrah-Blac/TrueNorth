import "server-only";
import connectToDatabase from "@/database/connection";
import AiAnalytics from "@/database/models/AiAnalytics";
import { logger } from "@/lib/logging/logger";

// Fixed, known ObjectId so there is always exactly one analytics
// document — same singleton convention as SiteSettings.
const AI_ANALYTICS_ID = "000000000000000000000002";

/**
 * All three increment helpers are deliberately "fire and forget" from
 * the caller's perspective: they're awaited (so the process doesn't
 * exit mid-write in a serverless environment) but any failure is caught
 * and logged, never thrown — a broken analytics write must never surface
 * as a broken chat reply or a broken quote-form page load.
 */

export async function recordConversationStarted(): Promise<void> {
  try {
    await connectToDatabase();
    await AiAnalytics.findByIdAndUpdate(
      AI_ANALYTICS_ID,
      { $inc: { totalConversations: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    logger.warn("recordConversationStarted failed", { error: String(error) });
  }
}

export async function recordToolUsage(toolName: string): Promise<void> {
  try {
    await connectToDatabase();
    await AiAnalytics.findByIdAndUpdate(
      AI_ANALYTICS_ID,
      { $inc: { [`toolUsage.${toolName}`]: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    logger.warn("recordToolUsage failed", { error: String(error), toolName });
  }
}

export async function recordQuoteStart(): Promise<void> {
  try {
    await connectToDatabase();
    await AiAnalytics.findByIdAndUpdate(
      AI_ANALYTICS_ID,
      { $inc: { quoteStarts: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    logger.warn("recordQuoteStart failed", { error: String(error) });
  }
}
