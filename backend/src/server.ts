import http from "node:http";
import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";

let server: http.Server | undefined;

/**
 * Ordering matters: the HTTP server is closed before the database, so no
 * in-flight request can find the connection gone underneath it.
 */
const shutdown = async (signal: string, code = 0): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`);

  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  await disconnectDB();

  process.exit(code);
};

const startServer = async (): Promise<void> => {
  // Before anything else — a missing secret should stop the process here,
  // not surface as a failed login later.
  validateEnv();
  await connectDB();

  server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

process.on("unhandledRejection", (reason: unknown) => {
  logger.error(
    `Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`
  );
  void shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  void shutdown("uncaughtException", 1);
});

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

startServer().catch((error: unknown) => {
  logger.error(
    `Failed to start server: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
