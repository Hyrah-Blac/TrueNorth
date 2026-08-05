import { Schema, model, models, type Model, type Document } from "mongoose";

/**
 * Singleton counters for the AI Concierge, incremented at the few real
 * chokepoints where these events already happen (see
 * src/lib/ai/analytics.ts) — no new query paths, no UX impact. Read-only
 * for now; a future admin dashboard can query this document directly.
 */
export interface AiAnalyticsDocument extends Document {
  totalConversations: number;
  /** Tool name -> call count, e.g. "search_aircraft" -> 42. */
  toolUsage: Map<string, number>;
  /** Incremented when a visitor reaches /request-charter from the concierge. */
  quoteStarts: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiAnalyticsSchema = new Schema<AiAnalyticsDocument>(
  {
    totalConversations: { type: Number, default: 0, min: 0 },
    toolUsage: { type: Map, of: Number, default: () => new Map() },
    quoteStarts: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Enforced as a singleton at the application layer (see
// src/lib/ai/analytics.ts) — always upsert against a fixed known _id,
// same convention as SiteSettings.
export const AiAnalytics: Model<AiAnalyticsDocument> =
  models.AiAnalytics || model<AiAnalyticsDocument>("AiAnalytics", AiAnalyticsSchema);

export default AiAnalytics;
