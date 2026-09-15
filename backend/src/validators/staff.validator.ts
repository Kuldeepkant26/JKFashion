import { body, param, type ValidationChain } from "express-validator";
import { PERMISSION_VALUES } from "../config/constants.js";

/**
 * The permissions array, shared by create and update.
 *
 * The `isIn` allowlist is the whole security story here: it is what stops an
 * arbitrary string being stored and later compared against a section name.
 * Note that STAFF is absent from PERMISSION_VALUES entirely, so it cannot be
 * granted through this endpoint at all.
 */
const permissionRules = (): ValidationChain[] => [
  body("permissions")
    .optional()
    .isArray({ max: PERMISSION_VALUES.length })
    .withMessage("Unknown permissions"),
  body("permissions.*")
    .isString()
    .trim()
    .isIn(PERMISSION_VALUES)
    .withMessage("Unknown section"),
];

/**
 * Staff accounts.
 *
 * Note what is NOT here: `role`. The service forces every account created
 * through this endpoint to EDITOR, so accepting a role from the client would
 * either be ignored or — if someone later wired it up — turn this into a way
 * to mint owners. Leaving it out of the validator makes that explicit.
 *
 * The email is trimmed and lowercased rather than run through
 * `normalizeEmail()`, matching the login rules: normalising strips Gmail dots
 * and would silently create an account that cannot then be signed into.
 */
export const createStaffRules: ValidationChain[] = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Give the person a name"),
  body("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    .customSanitizer((value: unknown) => String(value ?? "").trim().toLowerCase()),
  /**
   * Optional: omitted means "generate one". A supplied password still has to
   * meet the length rule, so the only way to get a weak one is to type it.
   */
  body("password")
    .optional()
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Use at least 8 characters"),

  ...permissionRules(),
];

export const updateStaffRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown account"),
  body("name").optional().isString().trim().isLength({ min: 2, max: 80 }),
  body("isActive").optional().isBoolean().toBoolean(),
  ...permissionRules(),
];

export const setPasswordRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown account"),
  body("password")
    .optional()
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Use at least 8 characters"),
];

export const staffIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown account"),
];
