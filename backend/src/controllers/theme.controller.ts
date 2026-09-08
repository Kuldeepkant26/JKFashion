import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as themeService from "../services/theme.service.js";
import type { ThemeSettingPatch } from "../services/theme.service.js";
import type { IThemeSetting } from "../models/theme.model.js";

/** One shape for both handlers, so the client parses a single response format. */
const toPayload = (theme: IThemeSetting) => ({
  themeId: theme.themeId,
  fontId: theme.fontId,
  navbarId: theme.navbarId,
  heroId: theme.heroId,
  hiddenThemeIds: theme.hiddenThemeIds ?? [],
  updatedAt: theme.updatedAt,
});

/**
 * The active appearance settings. Public — the website reads this on every
 * first visit, before (and without) any session.
 *
 * `hiddenThemeIds` is included even though only the admin picker consumes it:
 * splitting it into an owner-only endpoint would mean a second round trip on a
 * page that already has what it needs, to protect a list of preset names that
 * are compiled into the public bundle anyway.
 */
export const getTheme = asyncHandler<Request>(async (_req, res) => {
  const theme = await themeService.getTheme();

  res.status(200).json(new ApiResponse(200, toPayload(theme)));
});

/** Change palette, typography or hidden presets. Restricted to the owner. */
export const updateTheme = asyncHandler<AuthedRequest>(async (req, res) => {
  const { themeId, fontId, navbarId, heroId, hiddenThemeIds } =
    req.body as ThemeSettingPatch;

  // Only forward the keys the caller actually sent — the service treats
  // `undefined` as "leave alone", which is what lets the settings page save one
  // section without clobbering the others.
  const patch: ThemeSettingPatch = {};
  if (themeId !== undefined) patch.themeId = themeId;
  if (fontId !== undefined) patch.fontId = fontId;
  if (navbarId !== undefined) patch.navbarId = navbarId;
  if (heroId !== undefined) patch.heroId = heroId;
  if (hiddenThemeIds !== undefined) patch.hiddenThemeIds = hiddenThemeIds;

  const theme = await themeService.updateTheme(patch, req.user!._id as never);

  res.status(200).json(new ApiResponse(200, toPayload(theme), "Appearance updated"));
});
