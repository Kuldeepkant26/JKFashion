import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

/**
 * Runs after a validator chain. Collects field errors into ApiError.details so
 * the panel can render them beside the inputs that caused them, rather than as
 * one generic banner.
 */
export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const details = result.array().map((e) => ({
    field: (e as { path?: string; param?: string }).path ?? (e as { param?: string }).param ?? "",
    message: e.msg as string,
  }));

  next(new ApiError(422, "Validation failed", details));
};
