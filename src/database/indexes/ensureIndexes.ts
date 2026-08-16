import connectToDatabase from "../connection";
import User from "../models/User";
import Aircraft from "../models/Aircraft";
import Airport from "../models/Airport";
import KnowledgeBase from "../models/KnowledgeBase";
import { Conversation, Message } from "../models/Conversation";
import Quote from "../models/Quote";
import Booking from "../models/Booking";
import Payment from "../models/Payment";
import Ticket from "../models/Ticket";
import { logger } from "@/lib/logging/logger";

const MODELS = [
  User,
  Aircraft,
  Airport,
  KnowledgeBase,
  Conversation,
  Message,
  Quote,
  Booking,
  Payment,
  Ticket,
];

/**
 * Explicitly syncs indexes for every model with what's defined in the
 * schemas. Mongoose builds indexes automatically in development, but
 * `autoIndex` is typically disabled in production for performance —
 * run this once after deploying schema changes instead.
 */
export async function ensureIndexes(): Promise<void> {
  await connectToDatabase();

  for (const model of MODELS) {
    await model.syncIndexes();
    logger.info(`Synced indexes for ${model.modelName}`);
  }
}
