import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not catch rejections from async handlers — an unhandled one
 * silently hangs the request instead of reaching the error middleware. Wrapping
 * every async controller in this is what makes `throw new ApiError(...)` work.
 */
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
