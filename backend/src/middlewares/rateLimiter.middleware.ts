import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { isProduction } from "../config/env.js";

interface LimiterOptions {
  windowMs: number;
  max: number;
  message: string;
}

/**
 * Limits are relaxed tenfold outside production. A developer reloading the
 * login screen repeatedly should not lock themselves out, but the same
 * behaviour in production is what credential stuffing looks like.
 */
const build = ({ windowMs, max, message }: LimiterOptions): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    max: isProduction ? max : max * 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, success: false, message },
  });

/** Login and refresh — the endpoints an attacker can hammer without a session. */
export const authLimiter = build({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts, please try again in a few minutes",
});
