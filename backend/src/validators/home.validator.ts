import { body, type ValidationChain } from "express-validator";

/**
 * Hero text. Every field optional — the tab saves one field at a time, so an
 * admin editing a heading should not be forced to resend the rest.
 *
 * The lengths mirror the schema's maxlength, so an over-long value is rejected
 * with a readable message rather than a Mongoose validation error.
 */
export const updateSectionRules: ValidationChain[] = [
  body("hero.eyebrow").optional().isString().trim().isLength({ max: 80 }),
  body("hero.title").optional().isString().trim().isLength({ max: 80 }),
  body("hero.description").optional().isString().trim().isLength({ max: 600 }),
  body("hero.ctaLabel").optional().isString().trim().isLength({ max: 40 }),
  body("hero.imageAlt").optional().isString().trim().isLength({ max: 160 }),
];
