import { body, param, query, type ValidationChain } from "express-validator";

/**
 * The lengths mirror the schema's maxlength, so an over-long value is rejected
 * with a readable message rather than a Mongoose validation error.
 */
export const listCompanyRules: ValidationChain[] = [
  query("search").optional().isString().trim().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createCompanyRules: ValidationChain[] = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage("Give the company a name"),
  body("address").optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
  body("location").optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body("gst").optional({ checkFalsy: true }).isString().trim().isLength({ max: 20 }),
  body("contact").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
];

export const updateCompanyRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown company"),
  body("name").optional().isString().trim().isLength({ min: 1, max: 160 }),
  // `nullable` on update so a field can be explicitly cleared.
  body("address").optional({ nullable: true }).isString().trim().isLength({ max: 400 }),
  body("location").optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body("gst").optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body("contact").optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body("isActive").optional().isBoolean().toBoolean(),
];

export const companyIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown company"),
];
