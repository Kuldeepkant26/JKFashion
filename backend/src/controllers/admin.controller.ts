import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";

/**
 * Dashboard metrics.
 *
 * Deliberately zeroed and empty rather than seeded with plausible-looking
 * numbers: the panel must render its real empty states from day one, and a
 * fabricated chart shown to the client would be mistaken for live data.
 *
 * The shape is the contract the dashboard is built against, so wiring real
 * sources later is a change here only — no frontend edits.
 */
export const getStats = asyncHandler<AuthedRequest>(async (_req, res) => {
  const data = {
    tiles: [
      { key: "views", label: "Views", value: 0, deltaPct: 0, direction: "up" as const },
      { key: "enquiries", label: "Enquiries", value: 0, deltaPct: 0, direction: "up" as const },
      { key: "samples", label: "Sample Requests", value: 0, deltaPct: 0, direction: "up" as const },
    ],
    activity: {
      range: "7d",
      // [{ date: "2026-09-01", value: 0 }]
      points: [] as Array<{ date: string; value: number }>,
    },
    topProducts: [] as Array<{ id: string; name: string; handle: string; pct: number }>,
    channels: [] as Array<{ id: string; name: string; handle: string; deltaPct: number }>,
  };

  res.status(200).json(new ApiResponse(200, data));
});
