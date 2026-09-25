/**
 * Moves production orders still in the old SAMPLING status into samples.
 *
 *   npm run migrate:samples            — dry run: prints what it would do
 *   npm run migrate:samples -- --apply — does it
 *
 * Before samples were their own record, "sampling" was the first status of a
 * production order. Each such order becomes a sample (same buyer, design,
 * fabric, yarn, deadline, remarks and design image) and the order row is
 * removed, because it was never a production order in the first place.
 *
 * An order in SAMPLING that has production logged against it is not a sample
 * — metres were made — so it is kept as an order and moved to RUNNING.
 *
 * Safe to re-run: it only ever looks at rows still in SAMPLING.
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
import { docketNumbering } from "../utils/docketNumber.js";

const sampleNumbers = docketNumbering("sample", "SMP");

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
  if (!apply && legacy.length) logger.info("Re-run with --apply to make these changes.");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error: unknown) => {
  logger.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
