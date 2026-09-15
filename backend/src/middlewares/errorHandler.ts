import mongoose from "mongoose";
import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

/**
 * Translates known error shapes into ApiError so the response body is identical
 * whether the failure came from our code, from Mongoose, or from jsonwebtoken.
 * Without this the frontend would need a different parser per error source.
 */
const normalize = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new ApiError(422, "Validation failed", details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid value for '${err.path}'`);
  }

  // Duplicate key — the unique index rejected the write.
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {};
    const field = Object.keys(keyPattern)[0] ?? "field";
    return new ApiError(409, `A record with this ${field} already exists`, [
      { field, message: "Must be unique" },
    ]);
  }

  /*
   * multer rejects an oversized or unexpected file with its own error class,
   * which carries no statusCode — without this it would normalise to a 500 and
   * the uploader would show "Internal Server Error" for a file that is simply
   * too big.
   */
  if ((err as { name?: string })?.name === "MulterError") {
    const code = (err as { code?: string }).code;
    if (code === "LIMIT_FILE_SIZE") {
      return new ApiError(413, "That file is too large. Images are capped at 8MB and videos at 100MB.");
    }
    if (code === "LIMIT_FILE_COUNT" || code === "LIMIT_UNEXPECTED_FILE") {
      return new ApiError(400, "Please upload one file at a time");
    }
    return new ApiError(400, (err as { message?: string }).message ?? "Upload failed");
  }

  const name = (err as { name?: string })?.name;
  if (name === "TokenExpiredError") return new ApiError(401, "Session expired, please sign in again");
  if (name === "JsonWebTokenError") return new ApiError(401, "Invalid authentication token");

  const statusCode = (err as { statusCode?: number })?.statusCode;
  return new ApiError(
    statusCode && statusCode >= 400 ? statusCode : 500,
    (err as { message?: string })?.message ?? "Internal Server Error"
  );
};

/**
 * Must be registered last, and must declare all four parameters — Express
 * identifies error middleware by arity, so dropping `next` silently turns this
 * into an ordinary handler that never runs.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const error = normalize(err);

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${error.message}`);
    if (!isProduction) console.error(err);
  }

  res.status(error.statusCode).json({
    statusCode: error.statusCode,
    success: false,
    // A 500's message can carry internals (query fragments, file paths), so it
    // is replaced in production. Operational 4xx messages are written for users
    // and are safe to pass through.
    message: isProduction && error.statusCode >= 500 ? "Internal Server Error" : error.message,
    details: error.details ?? undefined,
    stack: isProduction ? undefined : error.stack,
  });
};
