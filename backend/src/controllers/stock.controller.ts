import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import type { StockCategory } from "../models/stockItem.model.js";
import { CATEGORY_CONFIG, STOCK_CATEGORIES } from "../models/stockItem.model.js";
import type { MovementDirection } from "../models/stockMovement.model.js";
import * as stockService from "../services/stock.service.js";

/** The acting user, as the service wants them. */
const actorOf = (req: AuthedRequest): stockService.Actor => ({
  _id: req.user!._id as never,
  name: req.user!.name,
});

/* -------------------------------------------------------------------- items */

/**
 * The item list, plus the category definitions the UI renders from.
 *
 * Shipping the config with the list means the client has one source for which
 * categories exist, what they are called, their units and whether breakage
 * applies — rather than a copy that drifts from the API's.
 */
export const listItems = asyncHandler<AuthedRequest>(async (req, res) => {
  const { category, search, includeArchived } = req.query as unknown as {
    category?: StockCategory;
    search?: string;
    includeArchived?: boolean;
  };

  // A fresh install would otherwise open on six empty tabs.
  await stockService.ensureDefaultItems(req.user!._id as never);

  const items = await stockService.listItems({ category, search, includeArchived });

  res.status(200).json(
    new ApiResponse(200, {
      items,
      categories: STOCK_CATEGORIES.map((key) => ({ key, ...CATEGORY_CONFIG[key] })),
    })
  );
});

export const createItem = asyncHandler<AuthedRequest>(async (req, res) => {
  const { category, name, unit } = req.body as {
    category: StockCategory;
    name: string;
    unit?: string;
  };

  const item = await stockService.createItem({ category, name, unit }, req.user!._id as never);

  res.status(201).json(new ApiResponse(201, item, "Item added"));
});

export const updateItem = asyncHandler<AuthedRequest>(async (req, res) => {
  const { name, unit } = req.body as { name?: string; unit?: string };

  const patch: stockService.UpdateItemPatch = {};
  if (name !== undefined) patch.name = name;
  if (unit !== undefined) patch.unit = unit;

  const item = await stockService.updateItem(req.params.id as string, patch);

  res.status(200).json(new ApiResponse(200, item, "Item saved"));
});

export const setBalance = asyncHandler<AuthedRequest>(async (req, res) => {
  const { balance, note } = req.body as { balance: number; note?: string };

  const result = await stockService.setBalance(
    req.params.id as string,
    balance,
    actorOf(req),
    note
  );

  res.status(200).json(new ApiResponse(200, result, "Stock updated"));
});

export const archiveItem = asyncHandler<AuthedRequest>(async (req, res) => {
  const { deleted } = await stockService.archiveItem(req.params.id as string);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deleted },
        deleted ? "Item removed" : "Item archived — its history is kept"
      )
    );
});

export const restoreItem = asyncHandler<AuthedRequest>(async (req, res) => {
  const item = await stockService.restoreItem(req.params.id as string);
  res.status(200).json(new ApiResponse(200, item, "Item restored"));
});

/* ---------------------------------------------------------------- movements */

export const listMovements = asyncHandler<AuthedRequest>(async (req, res) => {
  const { itemId, category, direction, from, to, page, limit } = req.query as unknown as {
    itemId?: string;
    category?: StockCategory;
    direction?: MovementDirection;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  };

  const result = await stockService.listMovements({
    itemId,
    category,
    direction,
    from,
    to,
    page,
    limit,
  });

  res.status(200).json(new ApiResponse(200, result));
});

const movementInput = (body: Record<string, unknown>): stockService.RecordMovementInput => ({
  direction: body.direction as MovementDirection,
  quantity: body.quantity as number,
  date: body.date as string | undefined,
  challanNo: body.challanNo as string | undefined,
  partyName: body.partyName as string | undefined,
  note: body.note as string | undefined,
});

export const createMovement = asyncHandler<AuthedRequest>(async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const result = await stockService.recordMovement(
    body.itemId as string,
    movementInput(body),
    actorOf(req)
  );

  // The warning rides along with the 201: the entry was saved, and the
  // operator still needs to be told the item is now short.
  res.status(201).json(new ApiResponse(201, result, result.warning ?? "Entry saved"));
});

export const editMovement = asyncHandler<AuthedRequest>(async (req, res) => {
  const result = await stockService.editMovement(
    req.params.id as string,
    movementInput(req.body as Record<string, unknown>),
    actorOf(req)
  );

  res.status(200).json(new ApiResponse(200, result, result.warning ?? "Entry corrected"));
});

export const reverseMovement = asyncHandler<AuthedRequest>(async (req, res) => {
  const result = await stockService.reverseMovement(req.params.id as string, actorOf(req));

  res.status(200).json(new ApiResponse(200, result, "Entry reversed"));
});

/* ----------------------------------------------------------------- expenses */

export const listExpenses = asyncHandler<AuthedRequest>(async (req, res) => {
  const { from, to, page, limit } = req.query as unknown as {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  };

  const [result, totals] = await Promise.all([
    stockService.listExpenses({ from, to, page, limit }),
    stockService.expenseTotals(),
  ]);

  res.status(200).json(new ApiResponse(200, { ...result, totals }));
});

/** Rupees in, paise stored. The conversion happens here and nowhere else. */
const toPaise = (rupees: number): number => Math.round(rupees * 100);

export const createExpense = asyncHandler<AuthedRequest>(async (req, res) => {
  const { date, description, amount } = req.body as {
    date?: string;
    description: string;
    amount: number;
  };

  const expense = await stockService.createExpense(
    { date, description, amountPaise: toPaise(amount) },
    actorOf(req)
  );

  res.status(201).json(new ApiResponse(201, expense, "Expense saved"));
});

export const updateExpense = asyncHandler<AuthedRequest>(async (req, res) => {
  const { date, description, amount } = req.body as {
    date?: string;
    description?: string;
    amount?: number;
  };

  const patch: Partial<stockService.ExpenseInput> = {};
  if (date !== undefined) patch.date = date;
  if (description !== undefined) patch.description = description;
  if (amount !== undefined) patch.amountPaise = toPaise(amount);

  const expense = await stockService.updateExpense(req.params.id as string, patch);

  res.status(200).json(new ApiResponse(200, expense, "Expense saved"));
});

export const deleteExpense = asyncHandler<AuthedRequest>(async (req, res) => {
  await stockService.deleteExpense(req.params.id as string);
  res.status(200).json(new ApiResponse(200, null, "Expense deleted"));
});

/* ------------------------------------------------------- report and summary */

export const dailyReport = asyncHandler<AuthedRequest>(async (req, res) => {
  const { date } = req.query as unknown as { date?: string };

  const report = await stockService.dailyReport(date);

  res.status(200).json(new ApiResponse(200, report));
});

export const getSummary = asyncHandler<AuthedRequest>(async (_req, res) => {
  const summary = await stockService.getSummary();
  res.status(200).json(new ApiResponse(200, summary));
});
