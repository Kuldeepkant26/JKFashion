import { body, param, query, type ValidationChain } from "express-validator";
import { STOCK_CATEGORIES } from "../models/stockItem.model.js";
import { ENTRY_DIRECTIONS, MOVEMENT_DIRECTIONS } from "../models/stockMovement.model.js";

/* -------------------------------------------------------------------- items */

export const listItemRules: ValidationChain[] = [
  query("category").optional().isIn(STOCK_CATEGORIES).withMessage("Unknown category"),
  query("search").optional().isString().trim().isLength({ max: 100 }),
  query("includeArchived").optional().isBoolean().toBoolean(),
];

export const createItemRules: ValidationChain[] = [
  body("category").isIn(STOCK_CATEGORIES).withMessage("Choose a category"),
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage("Give the item a name"),
  body("unit").optional({ checkFalsy: true }).isString().trim().isLength({ max: 20 }),
];

export const updateItemRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown item"),
  body("name").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("unit").optional().isString().trim().isLength({ min: 1, max: 20 }),
];

export const itemIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown item"),
];

/**
 * A counted stock figure.
 *
 * Negative is allowed: if someone has genuinely issued more than was recorded,
 * refusing the count would force them to enter a number they know is wrong.
 */
export const setBalanceRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown item"),
  body("balance")
    .isFloat({ min: -1_000_000, max: 10_000_000 })
    .withMessage("Enter the counted stock")
    .toFloat(),
  body("note").optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
];

/* ---------------------------------------------------------------- movements */

export const listMovementRules: ValidationChain[] = [
  query("itemId").optional().isMongoId().withMessage("Unknown item"),
  query("category").optional().isIn(STOCK_CATEGORIES).withMessage("Unknown category"),
  query("direction").optional().isIn(MOVEMENT_DIRECTIONS).withMessage("Unknown direction"),
  query("from").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid from date"),
  query("to").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid to date"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

/*
 * Only IN, OUT and BREAK may be recorded directly. A CORRECTION is written by
 * the service when a counted balance is set, and a reversal by the reverse
 * endpoint — neither is something a client gets to assert.
 */
const movementFields = (): ValidationChain[] => [
  body("direction").isIn(ENTRY_DIRECTIONS).withMessage("Choose In, Out or Break"),
  body("quantity")
    .isFloat({ gt: 0, max: 10_000_000 })
    .withMessage("Enter a quantity greater than zero")
    .toFloat(),
  body("date").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid date"),
  body("challanNo").optional({ checkFalsy: true }).isString().trim().isLength({ max: 60 }),
  body("partyName").optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
  body("note").optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
];

export const createMovementRules: ValidationChain[] = [
  body("itemId").isMongoId().withMessage("Choose an item"),
  ...movementFields(),
];

export const editMovementRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown entry"),
  ...movementFields(),
];

export const movementIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown entry"),
];

/* ----------------------------------------------------------------- expenses */

export const listExpenseRules: ValidationChain[] = [
  query("from").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid from date"),
  query("to").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid to date"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

/**
 * Money arrives as rupees, because that is what someone types, and is
 * converted to whole paise here at the edge. Everything inside the API deals
 * in integers — see the comment on the expense model.
 */
const amountRule = (optional: boolean): ValidationChain => {
  const chain = body("amount");
  return (optional ? chain.optional() : chain)
    .isFloat({ gt: 0, max: 100_000_000 })
    .withMessage("Enter an amount greater than zero")
    .toFloat();
};

export const createExpenseRules: ValidationChain[] = [
  body("date").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid date"),
  body("description")
    .isString()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage("Say what the expense was for"),
  amountRule(false),
];

export const updateExpenseRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown expense"),
  body("date").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid date"),
  body("description").optional().isString().trim().isLength({ min: 1, max: 300 }),
  amountRule(true),
];

export const expenseIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown expense"),
];

/* ------------------------------------------------------------------- report */

export const reportRules: ValidationChain[] = [
  query("date").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid date"),
];
