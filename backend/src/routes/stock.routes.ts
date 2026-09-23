import { Router } from "express";
import * as stockController from "../controllers/stock.controller.js";
import { protect, restrictTo, requirePermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { ROLES, PERMISSIONS } from "../config/constants.js";
import {
  listItemRules,
  createItemRules,
  updateItemRules,
  itemIdRules,
  setBalanceRules,
  listMovementRules,
  createMovementRules,
  editMovementRules,
  movementIdRules,
  listExpenseRules,
  createExpenseRules,
  updateExpenseRules,
  expenseIdRules,
  reportRules,
} from "../validators/stock.validator.js";

const router = Router();

/*
 * The daily materials ledger. Every route needs a session and the STOCK
 * permission — mounted once on the router rather than repeated per route, so a
 * route added later cannot ship ungated.
 *
 * Note what is NOT owner-only: recording, correcting and reversing movements
 * are the day-to-day work this section exists for, and reversals leave a full
 * audit trail. Only the genuinely destructive actions below are restricted.
 */
router.use(protect);
router.use(requirePermission(PERMISSIONS.STOCK));

/* ------------------------------------------------------------------ summary */

/* Literal paths are declared above the parameterised ones throughout, so
   "/items/:id" cannot quietly swallow "/items/summary". */
router.get("/summary", stockController.getSummary);

router.get("/report", reportRules, validate, stockController.dailyReport);

/* ----------------------------------------------------------------- expenses */

router.get("/expenses", listExpenseRules, validate, stockController.listExpenses);

router.post("/expenses", createExpenseRules, validate, stockController.createExpense);

router.patch("/expenses/:id", updateExpenseRules, validate, stockController.updateExpense);

/** Destructive and leaves no trace, so it is owner-only. */
router.delete(
  "/expenses/:id",
  restrictTo(ROLES.MAIN_ADMIN),
  expenseIdRules,
  validate,
  stockController.deleteExpense
);

/* ---------------------------------------------------------------- movements */

router.get("/movements", listMovementRules, validate, stockController.listMovements);

router.post("/movements", createMovementRules, validate, stockController.createMovement);

/** An edit is a reversal plus a replacement — the original is never rewritten. */
router.patch("/movements/:id", editMovementRules, validate, stockController.editMovement);

router.post(
  "/movements/:id/reverse",
  movementIdRules,
  validate,
  stockController.reverseMovement
);

/* -------------------------------------------------------------------- items */

router.get("/items", listItemRules, validate, stockController.listItems);

router.post("/items", createItemRules, validate, stockController.createItem);

router.patch("/items/:id", updateItemRules, validate, stockController.updateItem);

router.post("/items/:id/balance", setBalanceRules, validate, stockController.setBalance);

router.post("/items/:id/restore", itemIdRules, validate, stockController.restoreItem);

/**
 * Archives once the item has history, and only truly deletes an item nothing
 * was ever recorded against. Owner-only either way.
 */
router.delete(
  "/items/:id",
  restrictTo(ROLES.MAIN_ADMIN),
  itemIdRules,
  validate,
  stockController.archiveItem
);

export default router;
