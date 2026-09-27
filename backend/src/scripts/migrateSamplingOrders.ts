/**
 * Brings orders and samples up to the current model.
 *
 *   npm run migrate:samples            — dry run: prints what it would do
 *   npm run migrate:samples -- --apply — does it
 *
 * 1. Production orders still in the old SAMPLING status become samples.
 *    Before samples were their own record, "sampling" was the first status of
 *    a production order. Each such order becomes a sample (same buyer, design,
 *    fabric, yarn, deadline, remarks and design image) and the order row is
 *    removed, because it was never a production order in the first place. One
 *    that has production logged against it is not a sample — metres were
 *    made — so it is kept as an order and moved to RUNNING.
 *
 * 2. Samples marked "sent to buyer", a status that no longer exists, go back
 *    to in progress.
 *
 * 3. Samples that already have an order are marked in production, so they
 *    leave the Sampling list the way a converted sample does.
 *
 * Safe to re-run: each step only ever touches rows not yet in the new shape.
 */
import mongoose from "mongoose";
import { validateEnv } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import {
  ProductionOrder,
  ORDER_STATUS,
  LEGACY_ORDER_STATUS,
} from "../models/productionOrder.model.js";
import { Sample, SAMPLE_STATUS } from "../models/sample.model.js";

/** The retired "sent to buyer" status — no longer in the schema's enum. */
const LEGACY_SENT = "SENT";
import { sampleNumbers } from "../utils/docketNumber.js";

const run = async (): Promise<void> => {
  validateEnv();
  await connectDB();

  const apply = process.argv.includes("--apply");
  const legacy = await ProductionOrder.find({ status: LEGACY_ORDER_STATUS.SAMPLING }).exec();

  logger.info(
    `${legacy.length} order(s) in the old SAMPLING status${apply ? "" : " — dry run, nothing written"}`
  );

  let converted = 0;
  let promoted = 0;

  for (const order of legacy) {
    const produced = order.completedMetres > 0 || order.log.length > 0;

    if (produced) {
      logger.info(`  ${order.orderNumber}: has production logged → kept as an order, set RUNNING`);
      if (apply) {
        order.status = ORDER_STATUS.RUNNING;
        await order.save();
      }
      promoted += 1;
      continue;
    }

    logger.info(`  ${order.orderNumber} (${order.companyName}, ${order.designNumber}) → sample`);

    if (apply) {
      /*
       * The design image's Cloudinary file is handed over, not copied: the
       * order row is deleted directly below, so exactly one record owns it.
       * The order is deleted with deleteOne on the model rather than through
       * the service, which would destroy that image.
       */
      await Sample.create({
        company: order.company,
        companyName: order.companyName,
        sampleNumber: await sampleNumbers.next(order.companyName),
        designNumber: order.designNumber,
        status: SAMPLE_STATUS.IN_PROGRESS,
        designImage: order.designImage ?? {},
        fabricType: order.fabricType,
        fabricWidth: order.fabricWidth,
        yarnType: order.yarnType,
        yarnColor: order.yarnColor,
        deadline: order.deadline,
        remarks: [order.remarks, `Moved from order ${order.orderNumber}.`]
          .filter(Boolean)
          .join("\n"),
        createdBy: order.createdBy,
        updatedBy: order.updatedBy,
        createdAt: order.createdAt,
      });
      await ProductionOrder.deleteOne({ _id: order._id }).exec();
    }

    converted += 1;
  }

  logger.info(
    `${apply ? "Done" : "Would do"}: ${converted} converted to samples, ${promoted} kept as running orders.`
  );

  /*
   * Through the raw collection: "SENT" is no longer a valid value for the
   * model's enum, and this is the one place that has to match it anyway.
   */
  const sent = await Sample.collection.countDocuments({ status: LEGACY_SENT });
  logger.info(`${sent} sample(s) marked sent to buyer → in progress`);
  if (apply && sent) {
    await Sample.collection.updateMany(
      { status: LEGACY_SENT },
      { $set: { status: SAMPLE_STATUS.IN_PROGRESS }, $unset: { sentAt: "" } }
    );
  }

  const withOrders = await ProductionOrder.distinct("sample", { sample: { $ne: null } }).exec();
  const stranded = await Sample.countDocuments({
    _id: { $in: withOrders },
    status: { $ne: SAMPLE_STATUS.IN_PRODUCTION },
  }).exec();
  logger.info(`${stranded} sample(s) with an order but not marked in production → in production`);
  if (apply && stranded) {
    await Sample.updateMany(
      { _id: { $in: withOrders }, status: { $ne: SAMPLE_STATUS.IN_PRODUCTION } },
      { $set: { status: SAMPLE_STATUS.IN_PRODUCTION } }
    ).exec();
  }

  if (!apply && (legacy.length || sent || stranded)) {
    logger.info("Re-run with --apply to make these changes.");
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error: unknown) => {
  logger.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
