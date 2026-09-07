/**
 * Creates the first administrator.
 * Idempotent — running it repeatedly is a no-op.
 *
 *   npm run seed
 */
import mongoose from "mongoose";
import { env, validateEnv } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { ROLES } from "../config/constants.js";
import { AdminUser } from "../models/adminUser.model.js";

const run = async (): Promise<void> => {
  validateEnv();
  await connectDB();

  const email = env.seed.adminEmail.toLowerCase();
  const existing = await AdminUser.findOne({ email });

  if (existing) {
    // Backfill the flag on installs seeded before it existed.
    if (!existing.isProtected) {
      existing.isProtected = true;
      await existing.save();
      logger.info(`Admin already exists (${email}), marked protected`);
    } else {
      logger.info(`Admin already exists (${email}), skipping`);
    }
  } else {
    // passwordHash is hashed by the model's pre-save hook.
    await AdminUser.create({
      name: env.seed.adminName,
      email,
      passwordHash: env.seed.adminPassword,
      role: ROLES.MAIN_ADMIN,
      isProtected: true,
    });

    logger.info(`Admin created: ${email}`);
    logger.info(`Password: ${env.seed.adminPassword}  (change it after first login)`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error: unknown) => {
  logger.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
