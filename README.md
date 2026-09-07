# JK Fashion

Marketing site plus an admin panel for a schiffli embroidery and lace
manufacturer.

```
frontend/        React 19 + Vite + Tailwind v4 — the public site and the admin panel
backend/         Express + TypeScript + MongoDB — the admin API
package.json     orchestration only — runs both dev servers with one command
```

The root `package.json` is **not** a third application. Its only dependency is
`concurrently`, and it exists so `npm run dev` starts the API and the site
together instead of needing two terminals. Delete it and the two apps still
work; you would just run each one yourself.

## Running it

From this directory, once:

```bash
npm install            # installs concurrently (orchestration only)
npm run install:all    # installs both packages
npm run seed           # creates the first admin — safe to re-run
```

Then, every time:

```bash
npm run dev            # API on :5001, site on :5173
```

Or run them separately in two terminals if you prefer the logs apart:

```bash
cd backend  && npm run dev
cd frontend && npm run dev
```

## Signing in

| | |
|---|---|
| URL | http://localhost:5173/admin/login |
| Email | `admin@jkfashion.com` |
| Password | whatever `SEED_ADMIN_PASSWORD` is set to in `backend/.env` |

## Testing on a phone

Vite listens on all interfaces and prints a **Network** URL on startup. Open
that on any device on the same Wi-Fi — no config change needed. The API is
reached through Vite's `/api` proxy, so it follows the same host automatically.

## How the two halves connect

The frontend calls `/api/v1/...` relatively, and Vite proxies that to
`localhost:5001` in development (`frontend/vite.config.js`).

Keeping it relative means the API is **same-origin**, which is what lets the
refresh token live in a first-party httpOnly cookie with no CORS involved. The
same build works unchanged in production when the API is served from the site's
own domain. Set `VITE_API_BASE_URL` only if the API ends up on a different host.

## Deploying

The panel is a client-side route, so a static host must rewrite unknown paths to
`index.html` or `/admin/dashboard` will 404 on refresh:

- **Netlify** — `_redirects`: `/*  /index.html  200`
- **Vercel** — `vercel.json` rewrite to `/index.html`
- **Nginx** — `try_files $uri /index.html;`

If the API and the site end up on different domains, the refresh cookie needs
`sameSite: 'none'` + `secure: true` and an exact CORS origin. Serving both from
one origin avoids all of that and is the recommended setup.

## Security — before client handover

The MongoDB credential currently in `backend/.env` was shared in plain text and
**must be rotated**. See `backend/README.md` for the full checklist.

`.env` is gitignored at the root. There is no git repository in this directory
yet; if you run `git init`, confirm `git status` does not list `backend/.env`
before the first commit.
