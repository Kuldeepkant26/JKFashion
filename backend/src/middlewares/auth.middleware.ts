import type { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.util.js";
import { AdminUser, type IAdminUser } from "../models/adminUser.model.js";
import type { Role } from "../config/constants.js";

/** Express's Request with the authenticated account attached. */
export interface AuthedRequest extends Request {
  user?: IAdminUser;
}

/**
 * Requires a valid access token and loads the account onto req.user.
 *
 * The database read on every request is deliberate: it means deactivating an
 * account takes effect immediately, rather than whenever their 15-minute token
 * happens to expire. A token blocklist would be the alternative and is more
 * machinery than an admin panel of this size needs.
 */
export const protect = asyncHandler<AuthedRequest>(async (req, _res, next: NextFunction) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new ApiError(401, "Authentication required");

  const payload = verifyAccessToken(token);
  const user = await AdminUser.findById(payload.sub);

  if (!user) throw new ApiError(401, "Account no longer exists");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated");

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Always mounted after `protect`, which
 * is what guarantees req.user exists by the time this runs.
 */
export const restrictTo =
  (...roles: Role[]) =>
  (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(403, "You do not have permission to perform this action"));
      return;
    }
    next();
  };
