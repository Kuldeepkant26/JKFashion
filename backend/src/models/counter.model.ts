import mongoose, { Schema, type Document, type Model } from "mongoose";

/**
 * A named, monotonically increasing sequence.
 *
 * One document per sequence, keyed by a caller-chosen string (`order:Dexter`).
 * The only supported operation is `nextSeq` below — a single atomic
 * findOneAndUpdate with $inc, which is what makes it safe under concurrency.
 * Reading a value, adding one and writing it back would hand two simultaneous
 * callers the same number, which for order numbers means two dockets on the
 * floor claiming to be the same job.
 */
/** `Document<string>`: the key is the sequence's name, not an ObjectId. */
export interface ICounter extends Document<string> {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter: Model<ICounter> =
  (mongoose.models.Counter as Model<ICounter>) ||
  mongoose.model<ICounter>("Counter", counterSchema);

/**
 * Claim the next value of a sequence. Atomic, and creates the sequence on
 * first use so nothing has to be provisioned ahead of time.
 */
export const nextSeq = async (key: string): Promise<number> => {
  const counter = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  ).exec();

  return counter.seq;
};

/**
 * What `nextSeq` would return, without claiming it.
 *
 * Only for showing the operator a preview before they save. It is a guess by
 * construction: another create between the peek and the save moves it on, and
 * the number that ends up stored is whatever `nextSeq` hands out at write time.
 */
export const peekSeq = async (key: string): Promise<number> => {
  const counter = await Counter.findById(key).lean<ICounter>().exec();
  return (counter?.seq ?? 0) + 1;
};
