import { body, param, query, type ValidationChain } from "express-validator";
import { ORDER_STATUSES } from "../models/productionOrder.model.js";

/** "OVERDUE" is a derived view of the list, not a stored status. */
const LIST_STATUSES = [...ORDER_STATUSES, "OVERDUE"];

export const listOrderRules: ValidationChain[] = [
  query("status").optional().isIn(LIST_STATUSES).withMessage("Unknown status"),
  query("companyId").optional().isMongoId().withMessage("Unknown company"),
  query("sampleId").optional().isMongoId().withMessage("Unknown sample"),
  query("search").optional().isString().trim().isLength({ max: 100 }),
  /*
   * The range filters on when the order was raised. Left as strings rather
   * than `.toDate()`: the service normalises them to UTC day bounds itself, so
   * that both ends mean whole days regardless of the server's timezone.
   */
  query("from").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid from date"),
  query("to").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid to date"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const previewOrderNumberRules: ValidationChain[] = [
  query("companyId").isMongoId().withMessage("Choose a company"),
];

/*
 * The text fields mirror the schema's maxlength. The numbers are coerced here
 * so the controller never has to: an order arrives as multipart when it
 * carries a design image, and every field of a multipart body is a string.
 */
const orderFields = (optional: boolean): ValidationChain[] => {
  const opt = (chain: ValidationChain) =>
    optional ? chain.optional({ checkFalsy: true }) : chain;

  return [
    opt(body("fabricType").isString().trim().isLength({ max: 80 })),
    opt(body("fabricWidth").isString().trim().isLength({ max: 40 })),
    opt(body("yarnType").isString().trim().isLength({ max: 80 })),
    opt(body("yarnColor").isString().trim().isLength({ max: 60 })),
    opt(body("machine").isString().trim().isLength({ max: 80 })),
    opt(body("operator").isString().trim().isLength({ max: 120 })),
    opt(body("remarks").isString().trim().isLength({ max: 2000 })),
    body("startDate").optional({ checkFalsy: true }).isISO8601().toDate(),
    body("deadline").optional({ checkFalsy: true }).isISO8601().toDate(),
    body("estCompletion").optional({ checkFalsy: true }).isISO8601().toDate(),
    body("repeat").optional({ checkFalsy: true }).isFloat({ min: 0, max: 10_000 }).toFloat(),
    body("stitches").optional({ checkFalsy: true }).isInt({ min: 0, max: 100_000_000 }).toInt(),
    body("mendings").optional({ checkFalsy: true }).isInt({ min: 0, max: 100000 }).toInt(),
    body("rejectedMetres")
      .optional({ checkFalsy: true })
      .isFloat({ min: 0, max: 10_000_000 })
      .toFloat(),
    body("status").optional().isIn(ORDER_STATUSES).withMessage("Unknown status"),
  ];
};

/*
 * `orderNumber` is absent from both rule sets on purpose: the server generates
 * it, the controller never reads it off the body, and requiring it here would
 * make the form send a value that is then discarded.
 */
/*
 * A new order is always converted from a sample, so the sample is required
 * and the buyer is not asked for — it comes from the sample.
 */
export const createOrderRules: ValidationChain[] = [
  body("sampleId").isMongoId().withMessage("Choose the sample this order is converted from"),
  // Multipart sends "true"/"false" as text.
  body("useSampleImage").optional({ checkFalsy: true }).isBoolean().toBoolean(),
  body("designNumber")
    .isString()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage("Give the design a number"),
  body("orderedMetres")
    .isFloat({ min: 0.1, max: 10_000_000 })
    .withMessage("Enter the quantity ordered")
    .toFloat(),
  ...orderFields(true),
];

export const updateOrderRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown order"),
  // Only an order that predates samples may move buyer; the service enforces it.
  body("companyId").optional().isMongoId().withMessage("Unknown company"),
  body("designNumber").optional().isString().trim().isLength({ min: 1, max: 60 }),
  body("orderedMetres").optional().isFloat({ min: 0.1, max: 10_000_000 }).toFloat(),
  ...orderFields(true),
];

export const orderIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown order"),
];

export const setStatusRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown order"),
  body("status").isIn(ORDER_STATUSES).withMessage("Unknown status"),
];

export const logProductionRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown order"),
  /*
   * Signed, and 0 is rejected: a negative entry is a correction, but an entry
   * of nothing is a mistake rather than a fact worth recording.
   */
  body("metres")
    .isFloat({ min: -1_000_000, max: 1_000_000 })
    .withMessage("Enter the metres produced")
    .toFloat()
    .custom((v: number) => v !== 0)
    .withMessage("Enter a number other than zero"),
  body("date").optional({ checkFalsy: true }).isISO8601(),
  body("note").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
];

export const logEntryIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown order"),
  param("entryId").isMongoId().withMessage("Unknown log entry"),
];
