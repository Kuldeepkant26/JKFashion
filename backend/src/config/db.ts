import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const connectDB = async (): Promise<void> => {
  // Rejects queries on paths not in the schema instead of silently returning
  // everything — a typo'd filter should find nothing, not leak the collection.
  mongoose.set("strictQuery", true);

  mongoose.connection.on("error", (error: Error) => {
    logger.error(`MongoDB error: ${error.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  try {
    await mongoose.connect(env.mongoUri as string, {
      // Default is 30s, which makes a wrong URI or a blocked IP look like a
      // hang rather than a failure. Atlas IP allowlisting is the usual cause.
      serverSelectionTimeoutMS: 10_000,
    });
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error(
      `MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close(false);
};
