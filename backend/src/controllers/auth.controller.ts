import type { CookieOptions, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { env, isProduction } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";

/**
 * `sameSite: none` in production because the panel and the API may be served
 * from different hosts; that combination requires `secure`, which is why it is
 * only used there. On localhost http, `secure: true` would make the browser
 * drop the cookie silently — login would appear to succeed and every
 * subsequent refresh would fail.
 */
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: env.jwt.refreshMaxAgeMs,
};

const setRefreshCookie = (res: Response, token: string): Response =>
  res.cookie(authService.refreshCookieName, token, cookieOptions);

export const login = asyncHandler<AuthedRequest>(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const { refreshToken, ...data } = await authService.login(email, password);

  setRefreshCookie(res, refreshToken);
  res.status(200).json(new ApiResponse(200, data, "Signed in"));
});

export const refresh = asyncHandler<AuthedRequest>(async (req, res) => {
  const presented = req.cookies?.[authService.refreshCookieName] as string | undefined;
  const { refreshToken, ...data } = await authService.refreshSession(presented);

  setRefreshCookie(res, refreshToken);
  res.status(200).json(new ApiResponse(200, data, "Session refreshed"));
});

export const logout = asyncHandler<AuthedRequest>(async (req, res) => {
  await authService.logout(
    req.user,
    req.cookies?.[authService.refreshCookieName] as string | undefined
  );

  // maxAge must be omitted when clearing, or the browser keeps the cookie.
  res.clearCookie(authService.refreshCookieName, { ...cookieOptions, maxAge: undefined });
  res.status(200).json(new ApiResponse(200, null, "Signed out"));
});

/** The signed-in account. Used by the panel to restore a session on reload. */
export const me = asyncHandler<AuthedRequest>(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user!.toSafeObject() }));
});
