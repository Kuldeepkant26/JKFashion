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

## Branching — work on `main` only

**Do not create branches for new work.** Commit directly to `main`.

This is a single-developer project with one deployment. Feature branches were
adding a merge step and a chance for `main` to drift out of date without
buying any of the isolation they exist to provide — at one point `main` was
13 commits behind the branch the live server was actually running, which made
`main` the least trustworthy copy of the code rather than the canonical one.

So: `main` is the only branch. It is what the EC2 server deploys from, and it
should always be the newest, working code.

```bash
git add -A
git commit -m "..."
git push
```

If something genuinely risky needs isolating, stash it or keep it uncommitted
rather than branching.

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

## Staff accounts and access

The owner grants each staff account the sections it may open, in **Staff →
Access**: Inventory, Enquiries, Content, Settings and Dashboard. Managing
accounts is never grantable — it would let a staff member create accounts and
set passwords, which is the ability to make themselves an owner.

The sidebar hides what an account cannot reach, but that is only an
affordance. The API's `requirePermission` is the real boundary and refuses the
request regardless of what the browser sends.

**Passwords cannot be read back.** They are stored as bcrypt hashes, so not
even the server can recover one. To give someone their password, set a new one
(**Password**, leave the prompt blank to generate a strong one) — it is shown
once, with a copy button, and never again.

## Enquiry notification emails

When a visitor submits the enquiry form, the configured addresses get an email.
Recipients are managed in the panel — **Enquiries → Email notifications** — so
changing who is notified is not a deploy.

Sending needs SMTP credentials in `backend/.env` (see `.env.example`). For
Gmail, `SMTP_PASSWORD` must be a 16-character **App Password**, not the account
password — Google rejects the latter outright. App passwords live at
<https://myaccount.google.com/apppasswords> and require 2-Step Verification.

Without credentials the feature degrades rather than breaks: enquiries are still
saved and shown in the panel, the API still returns 201, and the settings screen
shows a warning that nothing will be delivered. The send is fire-and-forget, so
an unreachable mail host can never turn a successful submission into an error
for the visitor.

`Reply-To` is the enquirer, so replying from the inbox reaches the buyer rather
than the site's own mailbox.

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

`backend/.env` is gitignored and confirmed absent from `git status` — it holds
the Mongo URI and the SMTP app password, neither of which belongs in the repo.

The Gmail app password currently in `backend/.env` was shared in plain text over
chat and **should be revoked and reissued** at
<https://myaccount.google.com/apppasswords>. An app password only sends mail —
it cannot read the inbox or sign into the account — so this is housekeeping
rather than an emergency, but it is still a credential in a transcript.
