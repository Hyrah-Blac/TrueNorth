import { Schema, model, models, type Model } from "mongoose";

interface CounterDocument {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<CounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter: Model<CounterDocument> =
  models.Counter || model<CounterDocument>("Counter", CounterSchema);

/**
 * Atomically returns the next number in a day-scoped sequence, e.g. for
 * key "quote-20260720" this returns 1, 2, 3, ... regardless of how many
 * requests hit it concurrently. Safe under simultaneous inserts, unlike
 * counting existing documents (two concurrent reads can both see the same
 * count before either write commits, producing duplicate numbers).
 */
export async function getNextSequence(key: string): Promise<number> {
  const result = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return result!.seq;
}

export default Counter;
