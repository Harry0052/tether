# Tether

Tether helps someone online without taking over their identity. An owner keeps a checklist. A trusted helper can suggest the next step. The owner approves it. Nobody shares a password.

The working codename in the original brief was PROXY. The product name is Tether.

## Quickstart

Node.js 22 or newer. No API key.

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

`npm run db:setup` creates `data/tether.db`, applies the SQL in `drizzle/migrations`, and seeds one labeled sample family if it is not already there. The database path is `TETHER_DB_PATH` (see `.env.example`).

A production-style local process:

```bash
npm run db:setup
npm run build
npm run start
```

## Architecture

- Next.js App Router and React, TypeScript strict, Tailwind CSS.
- SQLite through `better-sqlite3` and Drizzle. The server opens the file and applies migrations. This matches the owner’s sibling app, Ripple, so the project runs locally without a hosted database. PostgreSQL is not wired up.
- Server routes under `src/app/api` call services in `src/lib`. Pages read those services directly.
- Sessions are random tokens stored only as a SHA-256 hash. The cookie is `httpOnly` and `SameSite=Lax`, and `Secure` only on HTTPS.
- Invitation links are HMAC-signed. Only the hash is stored. A bad signature is rejected before any name or title is read.
- Cache Components are off so one household’s checklists are not placed in a shared cache.

```text
src/app            routes and pages
src/components     shell, checklist, and design-system pieces
src/lib/db         schema, migrations, seed
src/lib/auth       sessions and display names
src/lib/tasks      checklists and steps
src/lib/trust      invitations and grants
src/lib/proposals  suggestions and owner decisions
src/lib/account    export and deletion
src/lib/i18n       English and Spanish copy
```

## What is real, sandboxed, or disabled

| Capability | State |
| --- | --- |
| Save a name for this browser | Real. Guest session in SQLite. |
| Create a checklist, mark steps, refresh | Real. |
| Sample family | Real seed rows, labeled Sample, read-only. |
| Invitation link, one use, expiry, revoke | Real. Email delivery is disabled, so you copy the link. |
| Helper suggestion and owner approval | Real. The decision is in the audit table. |
| Activity list | Real rows for checklists you can still open. |
| Text size, contrast, shorter labels, Spanish | Real. Spanish is a translation in this repo, not a certified localization. |
| Completion count on Settings | Real rows named `task_completed_with_approval` for that owner. Not a public chart. |
| Download data, delete data | Real for the current session. |
| Rate limits | Real fixed windows for checklists, invitations, and suggestions. |
| Local invite signing fallback | Sandbox. Settings says when `TETHER_INVITE_SECRET` is unset. Do not put that server on the public internet. |
| Email, OAuth, password reset, payments, other websites | Disabled. Nothing is simulated. |
| Hosted Postgres | Not in this repo. Not verified in CI. |

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

GitHub Actions runs the same list on pushes to `main`.

Screenshots of the main screens are in `docs/screenshots`. Deployment and rollback notes are in `docs/RUNBOOK.md`. The unrun pilot plan is in `docs/PILOT.md`.

This repository does not claim a compliance certification or that the app is ready for a public launch.
