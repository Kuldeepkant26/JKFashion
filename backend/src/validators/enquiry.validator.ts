import { body, query, param, type ValidationChain } from "express-validator";
import { ENQUIRY_STATUSES } from "../models/enquiry.model.js";
import { MAX_NOTIFY_RECIPIENTS } from "../models/enquirySetting.model.js";

/**
 * The public submit endpoint.
 *
 * This is the one route on the site that accepts unauthenticated writes, so
 * the limits are deliberately tight: every field is length-capped to match the
 * schema, and anything not listed here is dropped by the controller rather
 * than passed to the model.
 */
export const createEnquiryRules: ValidationChain[] = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Please enter your name"),

  body("email")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 200 }),

  /**
   * Optional, but validated when present. `checkFalsy` so an empty input from
   * the form counts as "not provided" rather than failing the pattern.
   */
  body("phone")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 6, max: 40 })
    .withMessage("Please enter a valid phone number"),

  body("company")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 160 }),

  body("message")
    .isString()
    .trim()
    .isLength({ min: 10, max: 4000 })
    .withMessage("Please tell us a little more — at least 10 characters"),

  /**
   * Honeypot. A real visitor never sees this field, so anything in it is a
   * bot filling every input on the page. Rejected as a validation error rather
   * than silently accepted, because a 400 costs us nothing here.
   */
  body("website")
    .optional()
    .isEmpty()
    .withMessage("Unable to submit this form"),
];

export const listEnquiryRules: ValidationChain[] = [
  query("status").optional().isIn(ENQUIRY_STATUSES).withMessage("Unknown status"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const updateEnquiryRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown enquiry"),
  body("status").isIn(ENQUIRY_STATUSES).withMessage("Unknown status"),
];

export const enquiryIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown enquiry"),
];

/**
 * The notification settings.
 *
 * Both fields optional so the screen can flip the toggle without resending the
 * address list. The cap on `recipients` is enforced here rather than in the
 * schema so the limit can be reported as a readable message instead of a
 * validation error from Mongoose.
 */
export const updateNotifyRules: ValidationChain[] = [
  body("notifyEnabled").optional().isBoolean().withMessage("Unknown value").toBoolean(),

  body("recipients")
    .optional()
    .isArray({ max: MAX_NOTIFY_RECIPIENTS })
    .withMessage(`You can notify up to ${MAX_NOTIFY_RECIPIENTS} email addresses`),

  /**
   * Each entry checked individually — an array that passes `isArray` can still
   * be full of anything, and these addresses are what the server will hand to
   * its SMTP host.
   */
  body("recipients.*")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please enter valid email addresses")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 200 })
    .withMessage("That email address is too long"),
];
