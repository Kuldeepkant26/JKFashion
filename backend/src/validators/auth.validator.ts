import { body, type ValidationChain } from "express-validator";

export const loginRules: ValidationChain[] = [
  body("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    // Lowercases and trims. Not `normalizeEmail()` with its default options,
    // which strips dots and +tags from Gmail addresses and would stop an admin
    // signing in with the exact address they were registered under.
    .customSanitizer((value: unknown) => String(value ?? "").trim().toLowerCase()),

  body("password")
    .isString()
    .withMessage("Password is required")
    .isLength({ min: 1 })
    .withMessage("Password is required"),
];
