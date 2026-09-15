import { body, param, type ValidationChain } from "express-validator";

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
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Use at least 8 characters"),
];

export const updateStaffRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown account"),
  body("name").optional().isString().trim().isLength({ min: 2, max: 80 }),
  body("isActive").optional().isBoolean().toBoolean(),
];

export const setPasswordRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown account"),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Use at least 8 characters"),
];

export const staffIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown account"),
];
