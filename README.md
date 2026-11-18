# Tether

Tether helps someone online without taking over their identity. An account owner keeps a checklist. A trusted helper can suggest. The owner approves. Nobody shares a password.

An owner can finish a checklist and invite one helper with a link that expires. Removing access takes effect on the helper’s next request. Approving a suggestion is not built yet. See `STATUS.md`.

## Quickstart

Node.js 22 or newer. No API key.

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

`npm run db:setup` creates `data/tether.db` and applies the SQL in `drizzle/migrations`. The database path is `TETHER_DB_PATH` (see `.env.example`).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

This repository does not claim a compliance certification or that the app is ready for a public launch.
