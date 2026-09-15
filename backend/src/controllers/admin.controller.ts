import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as statsService from "../services/stats.service.js";

/**
 * Dashboard metrics — real counts from the collections this panel owns.
 *
 * This previously returned hardcoded zeros plus empty "top products" and
 * "channels" panels, placeholders for web analytics that were never wired up.
 * Shown to a client they read as live traffic data that happened to be zero,
 * which is worse than showing nothing. Every figure here is now a live count.
 */
export const getStats = asyncHandler<AuthedRequest>(async (_req, res) => {
  const data = await statsService.getDashboardStats();

  res.status(200).json(new ApiResponse(200, data));
});
