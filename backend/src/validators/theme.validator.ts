import { body, type ValidationChain } from "express-validator";
import { THEME_IDS } from "../config/themes.js";

/**
 * The `isIn` allowlist is the entire security story for this endpoint: it is
 * what stops an authenticated admin from storing an arbitrary string that the
 * website would then apply to every visitor's page.
 */
export const updateThemeRules: ValidationChain[] = [
  body("themeId")
    .isString()
    .withMessage("A theme is required")
    .trim()
    .isIn(THEME_IDS)
    .withMessage("Unknown theme"),
];
