/**
 * Removes the photographs that production stages used to carry.
 *
 * Stages are drawn as icons now, so the `image` sub-object left on each step is
 * dead weight pointing at a live Cloudinary file nothing renders. This deletes
 * those files and strips the field.
 *
 * DESTRUCTIVE and deliberately manual — it is not wired into boot or deploy.
 * Run it once, after confirming the icon flow works:
 *
 *   npm run cleanup:step-images
 *
 * Idempotent — running it again finds nothing left to do.
 */
import mongoose from "mongoose";
import { validateEnv } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { destroyImage } from "../config/cloudinary.js";
import { ProcessSection } from "../models/processSection.model.js";

/**
 * `image` is no longer in the schema, so Mongoose's typed accessors cannot see
 * it. The raw document is read through the driver instead — the field is only
 * reachable as untyped data at this point.
 */
interface RawStep {
  _id: mongoose.Types.ObjectId;
  title?: string;
  image?: { publicId?: string };
}

const run = async (): Promise<void> => {
  validateEnv();
  await connectDB();

  const collection = mongoose.connection.collection("processsections");
  const doc = await collection.findOne({ key: "process" });

  if (!doc) {
    logger.info("No process section exists yet — nothing to clean up");
    await mongoose.connection.close();
    process.exit(0);
  }

  const steps = (doc.steps ?? []) as RawStep[];
  const withImages = steps.filter((s) => s.image?.publicId);

  if (!withImages.length) {
    logger.info("No stage photographs found — nothing to clean up");
    await mongoose.connection.close();
    process.exit(0);
  }

  logger.info(`Found ${withImages.length} stage photograph(s) to remove`);

  /*
   * Cloudinary first, then the field. destroyImage never throws, so a file that
   * has already been deleted by hand cannot block the rest of the run.
   */
  for (const step of withImages) {
    await destroyImage(step.image!.publicId!);
    logger.info(`  removed ${step.image!.publicId} (${step.title ?? "untitled"})`);
  }

  // $unset against the array's positional wildcard clears the field on every
  // step in one write, leaving the rest of each sub-document untouched.
  const result = await collection.updateOne(
    { key: "process" },
    { $unset: { "steps.$[].image": "" } }
  );

  logger.info(
    `Cleanup complete — ${withImages.length} file(s) deleted, ` +
      `${result.modifiedCount} document(s) updated`
  );

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error: unknown) => {
  logger.error(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
