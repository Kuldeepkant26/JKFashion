import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env, isProduction } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Without this, every request behind a proxy reports the proxy's IP, so the
// rate limiter would treat all traffic as one client.
app.set("trust proxy", 1);

app.use(helmet());

/**
 * An allowlist rather than a single origin, so the panel works from localhost
 * and from a phone on the LAN at the same time. Requests with no Origin (curl,
 * same-origin) are allowed through.
 */
export const corsOrigin: cors.CorsOptions["origin"] = (origin, callback) => {
  if (!origin || env.clientOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  // In development, accept any private-network address so a new device on the
  // Wi-Fi needs no config change. Never in production.
  if (
    !isProduction &&
    /^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)
  ) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`));
};

// credentials:true is required for the refresh cookie to be sent at all.
app.use(cors({ origin: corsOrigin, credentials: true }));

// 10kb: this API only ever receives small JSON bodies, and a low cap is free
// protection against a trivially large payload.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(morgan(isProduction ? "combined" : "dev"));

app.use("/api/v1", routes);

// Both must come after the routes: notFound catches anything unmatched, and
// errorHandler must be last of all to receive what the others pass along.
app.use(notFound);
app.use(errorHandler);

export default app;
