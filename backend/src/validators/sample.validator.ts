import { body, param, query, type ValidationChain } from "express-validator";
import { SAMPLE_STATUSES, SAMPLING_STATUSES } from "../models/sample.model.js";
import { REPEAT_PATTERN, normalizeRepeat } from "../utils/repeat.js";

export const listSampleRules: ValidationChain[] = [
  // A status, or a group: SAMPLING (everything not converted) or OPEN (convertible).
  query("status")
    .optional()
    .isIn([...SAMPLE_STATUSES, "SAMPLING", "OPEN"])
    .withMessage("Unknown status"),
  query("companyId").optional().isMongoId().withMessage("Unknown company"),
  query("search").optional().isString().trim().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const previewSampleNumberRules: ValidationChain[] = [
  query("companyId").isMongoId().withMessage("Choose a company"),
];

/*
 * Mirrors the schema's maxlength. Numbers are coerced here because a sample
 * with a design image arrives as multipart, where every field is a string.
 */
const sampleFields = (): ValidationChain[] => {
  const opt = (chain: ValidationChain) => chain.optional({ checkFalsy: true });

  return [
    opt(body("fabricType").isString().trim().isLength({ max: 80 })),
    opt(body("fabricWidth").isString().trim().isLength({ max: 40 })),
    opt(body("yarnType").isString().trim().isLength({ max: 80 })),
    opt(body("yarnColor").isString().trim().isLength({ max: 60 })),
    opt(body("remarks").isString().trim().isLength({ max: 2000 })),
    // As the floor writes it — "8/4" — tidied ("8//4" → "8/4") before it is checked.
    body("repeat")
      .optional({ checkFalsy: true })
      .customSanitizer(normalizeRepeat)
      .isLength({ max: 20 })
      .matches(REPEAT_PATTERN)
      .withMessage("Write the repeat like 8/4"),
    opt(body("stitches").isInt({ min: 0, max: 100_000_000 }).toInt()),
    opt(body("quantity").isFloat({ min: 0, max: 1_000_000 }).toFloat()),
    body("deadline").optional({ checkFalsy: true }).isISO8601().toDate(),
    // IN_PRODUCTION is set by converting the sample into an order, never by hand.
    body("status").optional().isIn(SAMPLING_STATUSES).withMessage("Unknown status"),
  ];
};

export const createSampleRules: ValidationChain[] = [
  body("companyId").isMongoId().withMessage("Choose a company"),
  body("designNumber")
    .isString()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage("Give the design a number"),
  ...sampleFields(),
];

export const updateSampleRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown sample"),
  body("companyId").optional().isMongoId().withMessage("Unknown company"),
  body("designNumber").optional().isString().trim().isLength({ min: 1, max: 60 }),
  ...sampleFields(),
];

export const sampleIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown sample"),
];

export const setSampleStatusRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown sample"),
  body("status").isIn(SAMPLING_STATUSES).withMessage("Unknown status"),
];
