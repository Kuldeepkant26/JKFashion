import mongoose from "mongoose";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Mongoose's readyState is 0-3 plus 99 ("uninitialized"), so this is a lookup
 * rather than an array — indexing an array would miss 99 entirely.
 */
const DB_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized",
};

/**
 * Reports the database state as well as uptime: a process that is listening but
 * cannot reach Mongo is not healthy, and a check that only proves the former
 * would keep a broken deployment in the load balancer.
 */
export const getHealth = asyncHandler<Request>(async (_req, res) => {
  const state = DB_STATES[mongoose.connection.readyState] ?? "unknown";

  res.status(200).json(
    new ApiResponse(200, {
      uptime: process.uptime(),
      database: state,
    })
  );
});
