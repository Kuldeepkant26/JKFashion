import { body, type ValidationChain } from "express-validator";
import { THEME_IDS, FONT_IDS, NAVBAR_IDS, HERO_IDS } from "../config/themes.js";

/**
 * The `isIn` allowlists are the entire security story for this endpoint: they
 * are what stop an authenticated admin from storing an arbitrary string that
 * the website would then apply to every visitor's page — a font stack in
 * particular could otherwise smuggle a `url()` into every page load.
 *
 * All three fields are optional so the settings page can save the palette, the
 * typography, or the hidden list on its own without having to resend the rest.
 * `optional()` here means "absent is fine"; a field that IS present still has
 * to pass its rule.
 */
export const updateThemeRules: ValidationChain[] = [
  body("themeId")
    .optional()
    .isString()
    .withMessage("A theme is required")
    .trim()
    .isIn(THEME_IDS)
    .withMessage("Unknown theme"),

  body("fontId")
    .optional()
    .isString()
    .withMessage("A font pairing is required")
    .trim()
    .isIn(FONT_IDS)
    .withMessage("Unknown font pairing"),

  body("navbarId")
    .optional()
    .isString()
    .trim()
    .isIn(NAVBAR_IDS)
    .withMessage("Unknown navbar layout"),

  body("heroId")
    .optional()
    .isString()
    .trim()
    .isIn(HERO_IDS)
    .withMessage("Unknown hero layout"),

  /**
   * Sent whole rather than as add/remove operations: the list is at most 30
   * short ids, and replacing it outright means two tabs cannot interleave a
   * hide and a restore into a state neither admin asked for.
   */
  body("hiddenThemeIds")
    .optional()
    .isArray({ max: THEME_IDS.length })
    .withMessage("Hidden themes must be a list"),

  body("hiddenThemeIds.*")
    .isString()
    .trim()
    .isIn(THEME_IDS)
    .withMessage("Unknown theme"),
];
