import { body, param, type ValidationChain } from "express-validator";

/**
 * Upload metadata. Both fields are optional: the controller falls back to the
 * filename for a title, and a caption is genuinely optional.
 *
 * The FILE itself is validated by multer's fileFilter (type) and limits
 * (size) before any of this runs.
 */
export const createImageRules: ValidationChain[] = [
  body("title").optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body("caption").optional({ checkFalsy: true }).isString().trim().isLength({ max: 300 }),
];

export const updateImageRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown image"),
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("caption").optional({ nullable: true }).isString().trim().isLength({ max: 300 }),
  body("isActive").optional().isBoolean().toBoolean(),
];

export const imageIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown image"),
];

export const reorderRules: ValidationChain[] = [
  body("ids").isArray({ min: 1, max: 200 }).withMessage("Send the full list of image ids"),
  body("ids.*").isMongoId().withMessage("Unknown image"),
];
