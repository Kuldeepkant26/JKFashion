import type { Types } from "mongoose";
import { ThemeSetting, type IThemeSetting } from "../models/theme.model.js";
import {
  DEFAULT_THEME_ID,
  DEFAULT_FONT_ID,
  DEFAULT_NAVBAR_ID,
  DEFAULT_HERO_ID,
  THEME_IDS,
} from "../config/themes.js";
import { ApiError } from "../utils/ApiError.js";

const SINGLETON = { key: "theme" };

/** What an admin may change in one call. Every field is optional. */
export interface ThemeSettingPatch {
  themeId?: string;
  fontId?: string;
  navbarId?: string;
  heroId?: string;
  hiddenThemeIds?: string[];
}

/**
 * The active appearance settings, creating the singleton on first read.
 *
 * Upsert-on-read means a fresh database serves the defaults rather than 404ing,
 * so the public site works before anyone has visited the settings page and no
 * seed step is required for the feature to function.
 */
export const getTheme = async (): Promise<IThemeSetting> =>
  ThemeSetting.findOneAndUpdate(
    SINGLETON,
    {
      $setOnInsert: {
        themeId: DEFAULT_THEME_ID,
        fontId: DEFAULT_FONT_ID,
        navbarId: DEFAULT_NAVBAR_ID,
        heroId: DEFAULT_HERO_ID,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec() as Promise<IThemeSetting>;

/**
 * Update any combination of palette, typography and hidden presets.
 *
 * Every id is validated against the allowlist by the route's validator before
 * this runs — that check is the whole security story for this endpoint, so it
 * must not be skipped by any other caller.
 */
export const updateTheme = async (
  patch: ThemeSettingPatch,
  updatedBy: Types.ObjectId
): Promise<IThemeSetting> => {
  const current = await getTheme();

  const themeId = patch.themeId ?? current.themeId;
  const hiddenThemeIds = patch.hiddenThemeIds ?? current.hiddenThemeIds ?? [];

  /**
   * Refuse to hide the theme the site is currently wearing.
   *
   * Allowing it would leave the picker with no way to select the active preset
   * and the next admin unable to tell why the site looks the way it does. The
   * caller should switch themes first, which is a decision only they can make.
   */
  if (hiddenThemeIds.includes(themeId)) {
    throw new ApiError(400, "Switch to another theme before hiding this one");
  }

  /**
   * At least one preset has to remain selectable, or the settings page becomes
   * a dead end that only a database edit can recover from.
   */
  if (patch.hiddenThemeIds && hiddenThemeIds.length >= THEME_IDS.length) {
    throw new ApiError(400, "At least one theme must stay available");
  }

  const $set: ThemeSettingPatch & { updatedBy: Types.ObjectId } = { updatedBy };
  if (patch.themeId !== undefined) $set.themeId = patch.themeId;
  if (patch.fontId !== undefined) $set.fontId = patch.fontId;
  if (patch.navbarId !== undefined) $set.navbarId = patch.navbarId;
  if (patch.heroId !== undefined) $set.heroId = patch.heroId;
  if (patch.hiddenThemeIds !== undefined) $set.hiddenThemeIds = patch.hiddenThemeIds;

  return ThemeSetting.findOneAndUpdate(SINGLETON, { $set }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  }).exec() as Promise<IThemeSetting>;
};
