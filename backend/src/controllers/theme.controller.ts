import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as themeService from "../services/theme.service.js";

/**
 * The active theme. Public — the website reads this on every first visit,
 * before (and without) any session.
 */
export const getTheme = asyncHandler<Request>(async (_req, res) => {
  const theme = await themeService.getTheme();

  res.status(200).json(
    new ApiResponse(200, {
      themeId: theme.themeId,
      updatedAt: theme.updatedAt,
    })
  );
});

/** Switch the site theme. Restricted to the owner by the route. */
export const updateTheme = asyncHandler<AuthedRequest>(async (req, res) => {
  const { themeId } = req.body as { themeId: string };
  const theme = await themeService.updateTheme(themeId, req.user!._id as never);

  res.status(200).json(
    new ApiResponse(
      200,
      { themeId: theme.themeId, updatedAt: theme.updatedAt },
      "Theme updated"
    )
  );
});
