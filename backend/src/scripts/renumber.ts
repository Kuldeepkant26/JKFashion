/**
 * Brings sample and order numbers into the current job-number format,
 * `JK-ORA-01` (see utils/docketNumber).
 *
 *   npm run renumber            — dry run: prints old → new
 *   npm run renumber -- --apply — does it
 *
 * Samples first, in the order they were raised, each taking the next number
 * after any already issued in the current format. Then orders: one converted
 * from a sample takes that sample's number — it is the same job — and one
 * created directly takes the next. The copy of a sample's number kept on its
 * order is updated with it, and each buyer code's counter is moved past what
 * was handed out, so the next new sample or order continues the sequence.
 *
 * Run it straight after deploying, before anyone raises new work, and the
 * existing jobs take the first numbers in each sequence (JK-ORA-01, -02…).
 *
 * Safe to re-run: a number already in the current format is never touched.
 */
import mongoose from "mongoose";
import { validateEnv } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { Sample } from "../models/sample.model.js";
import { ProductionOrder } from "../models/productionOrder.model.js";
import { Counter } from "../models/counter.model.js";
import {
  JOB_NUMBER_PATTERN,
  companyCode,
  jobCounterKey,
  jobNumbers,
} from "../utils/docketNumber.js";

interface Change {
  id: unknown;
  company: string;
  from: string;
  to: string;
}

const run = async (): Promise<void> => {
  validateEnv();
  await connectDB();

  const apply = process.argv.includes("--apply");

  const [samples, orders] = await Promise.all([
    Sample.find()
      .select("sampleNumber companyName createdAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .exec(),
    ProductionOrder.find()
      .select("orderNumber companyName sample createdAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .exec(),
  ]);

  /*
   * The highest count already spent per buyer code: by a sample or an order in
   * the current format, or by the counter itself — a number whose record was
   * later deleted is still spent, and handing it out again would put two
   * dockets with one number about.
   */
  const highest = new Map<string, number>();
  const spend = (code: string, seq: number) =>
    highest.set(code, Math.max(highest.get(code) ?? 0, seq));

  for (const number of [...samples.map((s) => s.sampleNumber), ...orders.map((o) => o.orderNumber)]) {
    const match = JOB_NUMBER_PATTERN.exec(number);
    if (match) spend(match[1]!, Number(match[2]));
  }

  const staleSamples = samples.filter((s) => !JOB_NUMBER_PATTERN.test(s.sampleNumber));
  const staleOrders = orders.filter((o) => !JOB_NUMBER_PATTERN.test(o.orderNumber));

  const codes = new Set([
    ...highest.keys(),
    ...staleSamples.map((s) => companyCode(s.companyName)),
    ...staleOrders.map((o) => companyCode(o.companyName)),
  ]);
  for (const code of codes) {
    const counter = await Counter.findById(jobCounterKey(code)).lean().exec();
    if (counter) spend(code, counter.seq);
  }

  const touched = new Set<string>();
  const nextFor = (companyName: string): string => {
    const code = companyCode(companyName);
    const seq = (highest.get(code) ?? 0) + 1;
    highest.set(code, seq);
    touched.add(code);
    return jobNumbers.format(companyName, seq);
  };

  /*
   * Samples, and the number each will carry once this has run.
   *
   * A sample converted after the current format arrived, while it still had
   * an old number, already has an order with a fresh job number. The sample
   * takes that number rather than another — one job, one number.
   */
  const orderNumberBySample = new Map(
    orders
      .filter((o) => o.sample && JOB_NUMBER_PATTERN.test(o.orderNumber))
      .map((o) => [String(o.sample), o.orderNumber])
  );
  const heldBySamples = new Set(
    samples.filter((s) => JOB_NUMBER_PATTERN.test(s.sampleNumber)).map((s) => s.sampleNumber)
  );

  const sampleNumberById = new Map(samples.map((s) => [String(s._id), s.sampleNumber]));
  const samplePlan: Change[] = staleSamples.map((s) => {
    const fromOrder = orderNumberBySample.get(String(s._id));
    const to = fromOrder && !heldBySamples.has(fromOrder) ? fromOrder : nextFor(s.companyName);
    heldBySamples.add(to);
    sampleNumberById.set(String(s._id), to);
    return { id: s._id, company: s.companyName, from: s.sampleNumber, to };
  });

  /*
   * Orders. A converted one takes its sample's number unless another order
   * already holds it — possible only in data written before a sample became
   * exactly one order — in which case it takes the next, like a direct one.
   */
  const taken = new Set(orders.filter((o) => JOB_NUMBER_PATTERN.test(o.orderNumber)).map((o) => o.orderNumber));
  const orderPlan: Change[] = staleOrders.map((o) => {
    const fromSample = o.sample ? sampleNumberById.get(String(o.sample)) : undefined;
    const to =
      fromSample && JOB_NUMBER_PATTERN.test(fromSample) && !taken.has(fromSample)
        ? fromSample
        : nextFor(o.companyName);
    taken.add(to);
    return { id: o._id, company: o.companyName, from: o.orderNumber, to };
  });

  const note = apply ? "" : " — dry run, nothing written";
  logger.info(`${samplePlan.length} sample(s) in an old number format${note}`);
  for (const c of samplePlan) logger.info(`  sample ${c.from} → ${c.to}  (${c.company})`);
  logger.info(`${orderPlan.length} order(s) in an old number format${note}`);
  for (const c of orderPlan) logger.info(`  order  ${c.from} → ${c.to}  (${c.company})`);

  if (apply && (samplePlan.length || orderPlan.length)) {
    for (const c of samplePlan) {
      await Sample.updateOne({ _id: c.id }, { $set: { sampleNumber: c.to } }).exec();
      // The copy of the sample's number that its order keeps.
      await ProductionOrder.updateMany({ sample: c.id }, { $set: { sampleNumber: c.to } }).exec();
    }

    for (const c of orderPlan) {
      await ProductionOrder.updateOne({ _id: c.id }, { $set: { orderNumber: c.to } }).exec();
    }

    // Past what was handed out, so new work continues the sequence.
    for (const code of touched) {
      await Counter.updateOne(
        { _id: jobCounterKey(code) },
        { $max: { seq: highest.get(code) ?? 0 } },
        { upsert: true, setDefaultsOnInsert: false }
      ).exec();
    }

    logger.info(`Renumbered ${samplePlan.length} sample(s) and ${orderPlan.length} order(s).`);
  } else if (samplePlan.length || orderPlan.length) {
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
