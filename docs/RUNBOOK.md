# Tether runbook

This describes how to run the app that is in this repository. It is not a certification, and it does not mean the app has been cleared for a public launch.

## What you are running

One Node.js process and one SQLite file. There is no hosted database, mailer, or queue in this repo. GitHub Actions runs lint, typecheck, unit tests, the production build, and Playwright against that local file.

## First run

```bash
npm install
npm run db:setup
npm run dev
```

`db:setup` creates the file at `TETHER_DB_PATH` (default `data/tether.db`), applies every SQL file in `drizzle/migrations` in order, and seeds the labeled sample family. The server applies the same migrations when it opens the file, and seeds the sample if it is missing.

## Environment

| Name | Required | Purpose |
| --- | --- | --- |
| `TETHER_DB_PATH` | No | SQLite file. Default `data/tether.db`. Not a secret. |
| `TETHER_INVITE_SECRET` | Before any shared host | HMAC key for invitation links. At least 16 characters. If it is unset, Tether uses a local fallback and says so on Settings. |

Do not commit `.env`. `.env.example` lists names only.

## Migrations

Migrations are forward-only SQL. `schema_migrations` records the filename. A file that has already been applied is skipped.

To change the schema, add the next numbered file. Do not edit a file that has already shipped to a database you care about.

## Rollback

There is no down migration. To roll back a bad deploy:

1. Stop the Node process.
2. Replace `data/tether.db` (and its `-wal` and `-shm` files, if present) with the copy you took before the deploy.
3. Start the previous build.

Take a copy of the SQLite file before applying a new migration on a machine that has real checklists. The sample seed is idempotent. User rows are not.

## Incident

- Take the process offline if invitation links are being abused. There is no remote kill switch beyond that.
- An owner removes a helper inside the product. The next request checks the grant row. Nothing is cached.
- Logs are JSON lines on stdout. They are written to omit password, token, and cookie fields. They are not shipped to another service by this repo.
- A person can download their JSON export and can delete their rows from Settings. Deletion asks them to type their name.

## What is not here

Email delivery, OAuth, password reset, payments, and connections to other websites are not implemented. Do not set a DNS name and describe those as available.
