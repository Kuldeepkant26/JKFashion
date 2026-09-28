/**
 * Gives samples still carrying the old number format ("Dexter-SMP-00004") the
 * current one ("JK-DEX-01").
 *
 *   npm run renumber:samples            — dry run: prints old → new
 *   npm run renumber:samples -- --apply — does it
 *
 * Numbers are handed out per buyer code, in the order the samples were raised,
 * after any already issued in the new format; the counter each code draws from
 * is then moved past them, so the next new sample continues the sequence. A
 * sample's number is also copied onto the order it was converted into, so that
 * copy is updated with it.
 *
 * Run it straight after deploying, before anyone raises a new sample, and the
 * existing samples take the first numbers in each sequence (JK-DEX-01, -02…).
 *
 * Safe to re-run: a sample already in the new format is never touched.
 */
import mongoose from "mongoose";
import { validateEnv } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { Sample } from "../models/sample.model.js";
import { ProductionOrder } from "../models/productionOrder.model.js";
import { Counter } from "../models/counter.model.js";
import { companyCode, sampleCounterKey, sampleNumbers } from "../utils/docketNumber.js";

/** A number already in the current format (see sampleNumbers), with its code and sequence. */
const CURRENT = /^JK-([A-Z0-9]{1,3})-(\d{2,})$/;

const run = async (): Promise<void> => {
  validateEnv();
  await connectDB();

  const apply = process.argv.includes("--apply");

  const samples = await Sample.find()
    .select("sampleNumber companyName createdAt")
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .exec();

  const stale = samples.filter((s) => !CURRENT.test(s.sampleNumber));

  /*
   * The highest number already spent per code: by a sample in the new format,
   * or by the counter itself — a number whose sample was later deleted is still
   * spent, and handing it out again would put two tags with one number about.
   */
  const highest = new Map<string, number>();
  const spend = (code: string, seq: number) =>
    highest.set(code, Math.max(highest.get(code) ?? 0, seq));

  for (const s of samples) {
    const match = CURRENT.exec(s.sampleNumber);
    if (match) spend(match[1]!, Number(match[2]));
  }

  const codes = new Set([...highest.keys(), ...stale.map((s) => companyCode(s.companyName))]);
  for (const code of codes) {
    const counter = await Counter.findById(sampleCounterKey(code)).lean().exec();
    if (counter) spend(code, counter.seq);
  }

  const plan = stale.map((s) => {
    const code = companyCode(s.companyName);
    const seq = (highest.get(code) ?? 0) + 1;
    highest.set(code, seq);
    return {
      id: s._id,
      code,
      company: s.companyName,
      from: s.sampleNumber,
      to: sampleNumbers.format(s.companyName, seq),
    };
  });

  logger.info(
    `${plan.length} sample(s) in the old number format${apply ? "" : " — dry run, nothing written"}`
  );
  for (const p of plan) logger.info(`  ${p.from} → ${p.to}  (${p.company})`);

  if (apply && plan.length) {
    for (const p of plan) {
      await Sample.updateOne({ _id: p.id }, { $set: { sampleNumber: p.to } }).exec();
      await ProductionOrder.updateMany({ sample: p.id }, { $set: { sampleNumber: p.to } }).exec();
    }

    // Past what was handed out, so the next new sample continues the sequence.
    for (const code of new Set(plan.map((p) => p.code))) {
      await Counter.updateOne(
        { _id: sampleCounterKey(code) },
        { $max: { seq: highest.get(code) ?? 0 } },
        { upsert: true, setDefaultsOnInsert: false }
      ).exec();
    }

    logger.info(`Renumbered ${plan.length} sample(s).`);
  } else if (plan.length) {
    logger.info("Re-run with --apply to make these changes.");
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error: unknown) => {
  logger.error(`Renumbering failed: ${error instanceof Error ? error.message : String(error)}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
