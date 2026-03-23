import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICounter extends Document<string> {
  _id: string; // counter name, e.g. 'task'
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

/**
 * Atomically increments and returns the next sequence number for the given counter name.
 * Safe for concurrent use — uses findOneAndUpdate with upsert.
 */
export async function getNextSequence(name: string): Promise<number> {
  const result = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return result!.seq;
}

export default Counter;
