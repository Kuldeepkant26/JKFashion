# JK Fashion — Admin API

Express + TypeScript + MongoDB. Serves the admin panel at `/admin` on the
frontend.

## Running

```bash
npm install
cp .env.example .env      # then fill in the values
npm run seed              # creates the first admin (idempotent)
npm run dev               # http://localhost:5001
```

> Port 5001, not 5000: macOS Control Center (AirPlay Receiver) occupies 5000.

| Script | What it does |
|---|---|
| `npm run dev` | `tsx watch` — restarts on save |
| `npm run build` | Compiles to `dist/` |
| `npm start` | Runs the compiled build |
| `npm run seed` | Creates/updates the first admin. Safe to re-run. |
| `npm run typecheck` | `tsc --noEmit` |

## A TypeScript gotcha worth knowing up front

`tsconfig.json` uses `module: NodeNext` with `"type": "module"`, so **relative
imports need a `.js` extension even though the source is `.ts`**:

```ts
import { env } from "./config/env.js";   // ✅  even though the file is env.ts
import { env } from "./config/env";      // ❌  fails at runtime
```

This is the single most common source of confusion with this setup. TypeScript
rewrites nothing at build time — the extension in your source is the one Node
resolves.

## Layout

```
src/
├── server.ts          boot: validate env → connect DB → listen
├── app.ts             express assembly (no listen, so it stays testable)
├── config/            env, database, shared constants
├── models/            mongoose schemas
├── validators/        express-validator rule chains
├── controllers/       HTTP in, HTTP out — thin
├── services/          business logic — no req/res in here
├── middlewares/       auth, validation, rate limits, error handling
├── utils/             ApiError, ApiResponse, asyncHandler, logger, tokens
└── scripts/           seedAdmin
```

The `controllers → services` split matters: controllers only translate between
HTTP and the service layer, so business logic stays testable without spinning
up Express.

## Response shape

Every success:

```json
{ "statusCode": 200, "success": true, "message": "Signed in", "data": { } }
```

Every failure:

```json
{ "statusCode": 422, "success": false, "message": "Validation failed",
  "details": [{ "field": "email", "message": "Enter a valid email address" }] }
```

`details` is per-field, so the panel renders each message beside its own input.
`middlewares/errorHandler.ts` normalises Mongoose and JWT errors into this shape
too, so the client never needs to know where a failure originated.

## Auth

Short-lived **access token** (15 min, `Authorization: Bearer`) plus a long-lived
**refresh token** in an httpOnly cookie (30 days).

- Only SHA-256 hashes of refresh tokens are stored, so a database leak yields
  no usable sessions.
- Refresh tokens **rotate**: each use issues a new one and invalidates the old.
- Presenting an already-rotated token is treated as theft — every session on
  that account is dropped and the user must sign in again.
- Login returns an identical message for "unknown email" and "wrong password",
  so the form cannot be used to enumerate accounts.

## Endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/health` | — |
| POST | `/api/v1/auth/login` | — (rate-limited) |
| POST | `/api/v1/auth/refresh` | refresh cookie |
| POST | `/api/v1/auth/logout` | access token |
| GET | `/api/v1/auth/me` | access token |
| GET | `/api/v1/admin/stats` | access token |

`/admin/stats` currently returns zeroed tiles and empty arrays. That is
deliberate — the panel renders real empty states rather than invented numbers,
and wiring up real sources later is a change in
`controllers/admin.controller.ts` only.

## Before handing this to the client

- [ ] **Rotate the MongoDB password.** The one currently in `.env` was shared in
      plain text and must be considered compromised.
- [ ] Restrict the Atlas Network Access IP allowlist (it is likely `0.0.0.0/0`).
- [ ] Generate fresh `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` for production.
- [ ] Change `SEED_ADMIN_PASSWORD` — the server refuses to boot in production
      while it is still the default.
