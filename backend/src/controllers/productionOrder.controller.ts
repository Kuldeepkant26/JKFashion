import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import type { OrderStatus } from "../models/productionOrder.model.js";
import * as orderService from "../services/productionOrder.service.js";

export const listOrders = asyncHandler<AuthedRequest>(async (req, res) => {
  // Already coerced by the validator's .toInt(), hence the double assertion.
  const { status, companyId, search, page, limit } = req.query as unknown as {
    status?: OrderStatus | "OVERDUE";
    companyId?: string;
    search?: string;
    page?: number;
    limit?: number;
  };

  const result = await orderService.listOrders({ status, companyId, search, page, limit });

  res.status(200).json(new ApiResponse(200, result));
});

export const getOrder = asyncHandler<AuthedRequest>(async (req, res) => {
  const order = await orderService.getOrder(req.params.id as string);
  res.status(200).json(new ApiResponse(200, order));
});

/**
 * The fields a caller may set on an order.
 *
 * `completedMetres` is deliberately absent: it is derived from the production
 * log, and accepting it here is exactly the drift the log exists to prevent.
 */
const ORDER_FIELDS = [
  "orderNumber",
  "designNumber",
  "status",
  "orderedMetres",
  "fabricType",
  "fabricWidth",
  "yarnType",
  "yarnColor",
  "startDate",
  "deadline",
  "estCompletion",
  "machine",
  "operator",
  "mendings",
  "rejectedMetres",
  "remarks",
] as const;

const pickFields = (body: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const field of ORDER_FIELDS) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
};

export const createOrder = asyncHandler<AuthedRequest>(async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const order = await orderService.createOrder(
    {
      ...(pickFields(body) as Omit<orderService.OrderInput, "companyId">),
      companyId: body.companyId as string,
    },
    req.user!._id as never,
    req.file ? { buffer: req.file.buffer, filename: req.file.originalname } : undefined
  );

  res.status(201).json(new ApiResponse(201, order, "Order created"));
});

export const updateOrder = asyncHandler<AuthedRequest>(async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const patch: orderService.OrderPatch = pickFields(body);
  if (body.companyId !== undefined) patch.companyId = body.companyId as string;

  const order = await orderService.updateOrder(
    req.params.id as string,
    patch,
    req.user!._id as never
  );

  res.status(200).json(new ApiResponse(200, order, "Order saved"));
});

export const setStatus = asyncHandler<AuthedRequest>(async (req, res) => {
  const { status } = req.body as { status: OrderStatus };

  const order = await orderService.setStatus(
    req.params.id as string,
    status,
    req.user!._id as never
  );

  res.status(200).json(new ApiResponse(200, order, "Status updated"));
});

export const logProduction = asyncHandler<AuthedRequest>(async (req, res) => {
  const { metres, date, note } = req.body as {
    metres: number;
    date?: string;
    note?: string;
  };

  const order = await orderService.logProduction(
    req.params.id as string,
    { metres, date, note },
    { _id: req.user!._id as never, name: req.user!.name }
  );

  res.status(201).json(new ApiResponse(201, order, "Production logged"));
});

export const deleteLogEntry = asyncHandler<AuthedRequest>(async (req, res) => {
  const order = await orderService.deleteLogEntry(
    req.params.id as string,
    req.params.entryId as string
  );

  res.status(200).json(new ApiResponse(200, order, "Entry removed"));
});

export const setImage = asyncHandler<AuthedRequest>(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose an image to upload");

  const order = await orderService.setImage(
    req.params.id as string,
    req.file.buffer,
    req.file.originalname
  );

  res.status(200).json(new ApiResponse(200, order, "Image updated"));
});

export const clearImage = asyncHandler<AuthedRequest>(async (req, res) => {
  const order = await orderService.clearImage(req.params.id as string);
  res.status(200).json(new ApiResponse(200, order, "Image removed"));
});

export const deleteOrder = asyncHandler<AuthedRequest>(async (req, res) => {
  await orderService.deleteOrder(req.params.id as string);
  res.status(200).json(new ApiResponse(200, null, "Order deleted"));
});

export const getSummary = asyncHandler<AuthedRequest>(async (_req, res) => {
  const summary = await orderService.getSummary();
  res.status(200).json(new ApiResponse(200, summary));
});
