import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import type { SampleStatus } from "../models/sample.model.js";
import * as sampleService from "../services/sample.service.js";

export const listSamples = asyncHandler<AuthedRequest>(async (req, res) => {
  // Already coerced by the validator's .toInt(), hence the double assertion.
  const { status, companyId, search, page, limit } = req.query as unknown as {
    status?: SampleStatus;
    companyId?: string;
    search?: string;
    page?: number;
    limit?: number;
  };

  const result = await sampleService.listSamples({ status, companyId, search, page, limit });
  res.status(200).json(new ApiResponse(200, result));
});

export const getSample = asyncHandler<AuthedRequest>(async (req, res) => {
  const sample = await sampleService.getSample(req.params.id as string);
  res.status(200).json(new ApiResponse(200, sample));
});

/**
 * The fields a caller may set. `sampleNumber` is absent: the server issues it,
 * exactly as it does an order number. `sentAt` and `decidedAt` are absent too
 * — they are stamped by the service when the status moves.
 */
const SAMPLE_FIELDS = [
  "designNumber",
  "status",
  "fabricType",
  "fabricWidth",
  "yarnType",
  "yarnColor",
  "repeat",
  "stitches",
  "quantity",
  "deadline",
  "remarks",
] as const;

/**
 * The fields present in this request. As on orders, "" means "not sent" and
 * null means "clear it" — a form posts every input it holds, and a blank one
 * must not wipe a value nobody touched.
 */
const pickFields = (body: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const field of SAMPLE_FIELDS) {
    const value = body[field];

    if (value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;

    out[field] = value === null ? (field === "deadline" ? undefined : "") : value;
  }

  return out;
};

export const createSample = asyncHandler<AuthedRequest>(async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const sample = await sampleService.createSample(
    {
      ...(pickFields(body) as Omit<sampleService.SampleInput, "companyId">),
      companyId: body.companyId as string,
    },
    req.user!._id as never,
    req.file ? { buffer: req.file.buffer, filename: req.file.originalname } : undefined
  );

  res.status(201).json(new ApiResponse(201, sample, "Sample created"));
});

export const updateSample = asyncHandler<AuthedRequest>(async (req, res) => {
  const body = req.body as Record<string, unknown>;

  const patch: sampleService.SamplePatch = pickFields(body);
  if (body.companyId !== undefined) patch.companyId = body.companyId as string;

  const sample = await sampleService.updateSample(
    req.params.id as string,
    patch,
    req.user!._id as never
  );

  res.status(200).json(new ApiResponse(200, sample, "Sample saved"));
});

export const setStatus = asyncHandler<AuthedRequest>(async (req, res) => {
  const { status } = req.body as { status: SampleStatus };

  const sample = await sampleService.setStatus(
    req.params.id as string,
    status,
    req.user!._id as never
  );

  res.status(200).json(new ApiResponse(200, sample, "Status updated"));
});

export const setImage = asyncHandler<AuthedRequest>(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose an image to upload");

  const sample = await sampleService.setImage(
    req.params.id as string,
    req.file.buffer,
    req.file.originalname
  );

  res.status(200).json(new ApiResponse(200, sample, "Image updated"));
});

export const clearImage = asyncHandler<AuthedRequest>(async (req, res) => {
  const sample = await sampleService.clearImage(req.params.id as string);
  res.status(200).json(new ApiResponse(200, sample, "Image removed"));
});

export const deleteSample = asyncHandler<AuthedRequest>(async (req, res) => {
  await sampleService.deleteSample(req.params.id as string);
  res.status(200).json(new ApiResponse(200, null, "Sample deleted"));
});

/** The number a new sample for this buyer would get. A preview, not a reservation. */
export const previewSampleNumber = asyncHandler<AuthedRequest>(async (req, res) => {
  const { companyId } = req.query as unknown as { companyId: string };
  const sampleNumber = await sampleService.previewSampleNumber(companyId);
  res.status(200).json(new ApiResponse(200, { sampleNumber }));
});
