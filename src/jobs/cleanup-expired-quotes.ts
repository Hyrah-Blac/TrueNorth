import "server-only";
import connectToDatabase from "@/database/connection";
import Quote from "@/database/models/Quote";
import { QUOTE_STATUSES } from "@/database/constants/quote-status";
import { logger } from "@/lib/logging/logger";

/**
 * Marks quotes still sitting in pending/reviewing as expired once
 * their requested departure date has passed — they're no longer
 * actionable at that point. Intended to run daily via
 * /api/cron/cleanup-expired-quotes — see vercel.json.
 */
export async function cleanupExpiredQuotes(): Promise<{ expired: number }> {
  await connectToDatabase();

  const result = await Quote.updateMany(
    {
      status: { $in: [QUOTE_STATUSES.PENDING, QUOTE_STATUSES.REVIEWING] },
      departureDate: { $lt: new Date() },
    },
    { $set: { status: QUOTE_STATUSES.EXPIRED } }
  );

  logger.info("Expired-quote cleanup complete", { expired: result.modifiedCount });
  return { expired: result.modifiedCount };
}
