import type { Types } from "mongoose";
import { ThemeSetting, type IThemeSetting } from "../models/theme.model.js";
import { DEFAULT_THEME_ID } from "../config/themes.js";

const SINGLETON = { key: "theme" };

/**
 * The active theme, creating the singleton on first read.
 *
 * Upsert-on-read means a fresh database serves the default rather than 404ing,
 * so the public site works before anyone has visited the settings page and no
 * seed step is required for the feature to function.
 */
export const getTheme = async (): Promise<IThemeSetting> =>
  ThemeSetting.findOneAndUpdate(
    SINGLETON,
    { $setOnInsert: { themeId: DEFAULT_THEME_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec() as Promise<IThemeSetting>;

/**
 * Switch the active theme.
 *
 * `themeId` is validated against the allowlist by the route's validator before
 * this runs — that check is the whole security story for this endpoint, so it
 * must not be skipped by any other caller.
 */
export const updateTheme = async (
  themeId: string,
  updatedBy: Types.ObjectId
): Promise<IThemeSetting> =>
  ThemeSetting.findOneAndUpdate(
    SINGLETON,
    { $set: { themeId, updatedBy } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec() as Promise<IThemeSetting>;
