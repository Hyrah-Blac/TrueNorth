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

  const now = new Date();

  const [unpriced, unaccepted] = await Promise.all([
    Quote.updateMany(
      {
        status: { $in: [QUOTE_STATUSES.PENDING, QUOTE_STATUSES.REVIEWING] },
        departureDate: { $lt: now },
      },
      { $set: { status: QUOTE_STATUSES.EXPIRED } }
    ),
    // Priced quotes the customer never accepted/declined before their
    // quoted validity window closed — no longer safe to accept.
    Quote.updateMany(
      {
        status: QUOTE_STATUSES.APPROVED,
        validUntil: { $exists: true, $ne: null, $lt: now },
      },
      { $set: { status: QUOTE_STATUSES.EXPIRED } }
    ),
  ]);

  const expired = unpriced.modifiedCount + unaccepted.modifiedCount;
  logger.info("Expired-quote cleanup complete", { expired });
  return { expired };
}
