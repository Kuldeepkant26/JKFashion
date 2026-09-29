import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import { effectivePermissions } from "../models/adminUser.model.js";
import { PERMISSIONS } from "../config/constants.js";
import * as dashboardService from "../services/dashboard.service.js";

/**
 * The dashboard — live figures from the collections this panel owns.
 *
 * Money and stock ride along only for an account that can open the Inventory
 * Management section, where those figures live; the rest is the business
 * overview anyone with Dashboard access may see.
 */
export const getDashboard = asyncHandler<AuthedRequest>(async (req, res) => {
  // Already vetted and coerced by the validator.
  const { range = 30 } = req.query as unknown as { range?: dashboardService.DashboardRange };

  const data = await dashboardService.getDashboard({
    range,
    withStock: effectivePermissions(req.user!).includes(PERMISSIONS.STOCK),
  });

  res.status(200).json(new ApiResponse(200, data));
});
