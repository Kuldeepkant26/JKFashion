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

/**
 * The public enquiry form — the only unauthenticated write on the site.
 *
 * Generous enough that a buyer who mistypes their email and resubmits a few
 * times is never blocked, tight enough that the form cannot be used to flood
 * the admin list or to relay spam through it.
 */
export const enquiryLimiter = build({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: "You have sent several enquiries recently — please try again later",
});
