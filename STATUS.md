# Tether status

The product in the build brief is codenamed PROXY. The owner renamed it **Tether**. This repository is that product.

Tether helps an adult child, caregiver, or trusted friend work through a checklist with the account owner. The helper can suggest. The owner approves. Nobody shares a password.

The owner pre-approved Stages 0 through 6 for this build and asked that work continue on `main` without pull requests. Each stage is still implemented and reported separately.

## Stage 0 — Inspect and design

Inspected `/workspace` on 2026-11-18. The GitHub repository `Harry0052/tether` contained one commit: a README with the title `tether`. No application, workflow, or secret files were present. Nothing was overwritten.

The sibling project `Harry0052/ripple` is the stack to follow:

- Next.js App Router, React, TypeScript strict, Tailwind CSS 4
- SQLite via `better-sqlite3` and Drizzle, SQL migrations in `drizzle/migrations`, seed data marked demo
- Session cookies stored as SHA-256 hashes; passwords with bcrypt
- Vitest, Playwright, ESLint, `tsc --noEmit`, `next build`
- GitHub Actions on pushes to `main`

PostgreSQL is the brief's generic default. SQLite is the deliberate difference, for the same reason as Ripple: the app must run locally with no API keys and no hosted database. A hosted Postgres migration is a later deployment target, not something this repository claims to have verified.

### Confirmed product scope

In scope for this build:

- Owner-created checklists from a small set of safe templates, plus a custom list the owner writes
- Progress stored on the server and restored after refresh
- A signed, one-use invitation with an expiry, a `suggest` capability, and immediate revoke
- Helper suggestions for a checklist step or a comment; the owner approves or rejects
- An append-only activity list with redacted metadata
- Text size, contrast, simplified labels, English and Spanish
- Local accounts (guest session, then optional email and password), export, and deletion
- A labeled sample family that is not the visitor's data

Out of scope, and kept visibly disabled:

- Password collection, credential sharing, and remote control of another person's device
- Bank transfers, medical decisions, and submitting forms to other sites
- Email delivery, OAuth, password reset, payments, and any third-party task destination
- Covert assistance and impersonation

### Integrations

| Integration | State |
| --- | --- |
| SQLite on the local machine | Will be real |
| Sample family seed | Will be real rows, labeled Sample |
| Email, OAuth, SMS, payments, external websites | Missing. No sandbox vendor is configured. The product will not pretend they work |

Invitation links are copied by the people involved. There is no mailer to configure.

### Primary mobile flow

1. **Home.** The visitor sees the promise, what Tether refuses to do, and one action: start a checklist.
2. **New checklist.** They pick a plain-language template, name themselves, and optionally set a due date.
3. **Task room.** The checklist, progress, and the line "You are in control" are on one screen. They can mark their own steps done.
4. **Invite.** They create a link that expires. Tether shows the link once and tells them email sending is disabled.
5. **Helper review.** The helper sees who invited them, the checklist name, the single capability ("suggest"), and the expiry. They accept or leave.
6. **Suggestion.** The helper suggests that a step is done, or leaves a comment. They cannot mark it done themselves.
7. **Approval.** The owner approves or rejects. The checklist and the activity list update from the database.
8. **Return.** Refresh, a second visit, or the helper's own phone reads the same rows.
9. **Revoke.** The owner removes access. The helper's next request for that checklist fails.

Happy path: steps 1–8, ending with a completed checklist that included an owner approval.

No-invite path: a second browser opens the checklist URL and sees a generic unavailable message. No title, no name.

Bad-invite path: a damaged or expired link shows "This invitation link is not valid." It does not reveal who created it.

Failure path: a rejected suggestion leaves the step untouched; a network error leaves the previous database state and offers a retry; a duplicate submit returns the original row.

### Component map (lean)

- Shell: skip link, wordmark, control strip, desktop navigation, mobile navigation, footer
- UI: button, field, badge, progress, empty state, skeleton, banner
- Product: checklist, suggestion list, invite panel, people list, activity list, settings form
- Server: task, invite, proposal, activity, account, and settings services behind route handlers

### Domain model for Stage 2

Stage 2 needs only:

- `users` — display name, guest or member, locale and accessibility columns (stored now, edited in Stage 5)
- `sessions`
- `tasks` — owner, title, template, status, due date, demo or user origin
- `task_steps` — ordinal, instruction, pending or done
- `audit_events` — actor, type, redacted metadata
- `metric_events` — owner-scoped completion counts

Stage 3 adds invitations, trusted relations, and capability grants. Stage 4 adds proposals and approval events. Those tables are not created in Stage 2.

### Security boundary

- The server decides who the actor is from the session cookie. Client-supplied user ids are ignored.
- A checklist is visible to its owner and to a helper with an unexpired, unrevoked `suggest` grant. Everyone else gets the same not-available response.
- Helpers cannot complete steps, decide proposals, invite other people, or open the owner's other checklists.
- Invite tokens are HMAC-signed and stored only as a SHA-256 hash. A malformed token is rejected before any personal data is read.
- Activity metadata is a whitelist and runs through secret redaction. Typed passwords are not copied into the log.
- Demo rows are read-only.
- Writes check the `Origin` header.
- Rate limits are fixed windows in SQLite.
- No secret belongs in the repository. The local invite key is a documented development fallback, and the settings screen says when that fallback is in use.

### Technical risks

1. **Next.js cookie writes** only work in route handlers, not during render. Starting a guest session has to be a POST.
2. **`next start` runs in production mode**, including Playwright. The local invite fallback must keep single-machine tests working and must be labeled, not silently treated as a deployed secret.
3. **SQLite file locking** with one Node process is acceptable locally. This design is not a multi-server deployment.
4. **Spanish coverage** can drift from English. Both dictionaries will share one TypeScript type so a missing string fails the build.
5. **Invitation links in chat logs** are bearer secrets until they expire or are used. The UI has to say that plainly because there is no email channel with a better delivery story.

### Stage 1 checklist

- Scaffold the Ripple-shaped toolchain: strict TypeScript, ESLint, Vitest, Playwright, Tailwind, migrations, `.env.example`, CI
- Design tokens for navy `#14253D`, mint `#D7F5E8`, and ivory `#FAFCFA`, with large type and visible focus
- App shell, mobile navigation, 404, error boundary, loading skeleton
- One real screen: home, plus a settings screen that creates a guest session and stores a display name
- No control that pretends to create a checklist, send email, or connect another service
- Run lint, typecheck, unit test, and production build

### What will be true by the end of Stage 2

An owner can create a checklist, mark steps done, refresh, and see the same progress. The sample family, if shown, is labeled Sample. Email, OAuth, payments, and outside websites stay disabled.

---

## Stage reports

### Stage 0

```text
PRODUCT: Tether
STAGE: 0
STATUS: PASS
USER-FACING WORKING FLOWS: None yet. The repository had no application. The first real action by the end of Stage 2 will be creating a checklist and completing a step, with the result still there after refresh.
UI/UX: No screens built. Mobile flow is the nine-step sequence in this file. Visual language is navy, mint, and ivory, with large type and a persistent control line.
DATA + SECURITY: No tables yet. Boundary is documented above: session actor, owner-or-grant reads, hashed invite tokens, redacted audit, demo rows read-only.
TESTS: not run — no application code in this stage
REAL INTEGRATIONS: none yet | SANDBOX: sample family will be local SQLite rows, not an outside vendor | DISABLED: email, OAuth, SMS, payments, external site submission, password reset
FILES CHANGED: STATUS.md
OPEN BUGS/RISKS: Empty product. Risks 1–5 above.
NEXT STAGE PROPOSAL: Stage 1 foundation — toolchain, design shell, guest display name saved in SQLite.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```

### Stage 1

```text
PRODUCT: Tether
STAGE: 1
STATUS: PASS
USER-FACING WORKING FLOWS: A visitor can open the home page, save a display name, refresh, and see that name again. The name is a guest session in SQLite. Home and Settings are the only navigation items. Disabled services are described as text, not buttons.
UI/UX: Inspected home at 390px and 1440px, and settings at 390px (docs/screenshots/01-*). Skip link receives the first tab stop. Focus outline is a 3px navy ring. Mobile navigation is a bottom bar. The fixed bar covers the bottom of a tall screen until the page is scrolled; body padding leaves room at the end. No console page errors in the end-to-end run.
DATA + SECURITY: users, sessions, and rate_buckets. Session token is stored as a SHA-256 hash. Cookie is httpOnly, SameSite=Lax, Secure only on HTTPS. Redirects use the browser Host so a save on 127.0.0.1 is not sent to localhost and dropped. Display names reject control characters and bidi overrides. No password is collected.
TESTS: npm test -> 6 passed; npm run typecheck -> pass; npm run lint -> pass; npm run build -> pass; CI=true npm run test:e2e -> 1 passed (foundation.spec.ts).
REAL INTEGRATIONS: SQLite | SANDBOX: none | DISABLED: email, OAuth, password reset, payments, other websites
FILES CHANGED: Next.js app, design tokens, shell, settings, guest session, migration 0001, CI, foundation e2e, three screenshots.
OPEN BUGS/RISKS: Checklists do not exist yet. The local database file is the whole store. Invite signing is not implemented; the env example names TETHER_INVITE_SECRET for later.
NEXT STAGE PROPOSAL: Stage 2 — an owner creates a checklist, marks steps done, and still sees them after refresh.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```

### Stage 2

```text
PRODUCT: Tether
STAGE: 2
STATUS: PASS
USER-FACING WORKING FLOWS: An owner starts a checklist from a safe template or their own steps, marks every step done, and still sees the completed list after refresh. Marking a step not done reopens it. A second browser with no invitation gets “This checklist is not available to you” and no title. The sample family is labeled Sample, is not in the owner’s inbox, and has no Mark done buttons. An empty custom list is rejected. A dropped network shows an offline message and saves nothing.
UI/UX: Home, empty inbox, task room, and sample inspected at 390px. Task room also at 1440px (docs/screenshots/02-*). Navigation is Home, Tasks, Settings, with a three-item mobile bar. Pending steps use muted text; done steps use green. Focus rings and labels stay in place. No page errors in the browser run.
DATA + SECURITY: tasks, task_steps, audit_events, metric_events. Only the owner can read or change a user checklist. Writes check Origin. Create is rate-limited and idempotent. Audit metadata redacts a password typed into a title; the checklist itself still shows the title the owner chose. Demo rows are read-only.
TESTS: npm test -> 16 passed; npm run typecheck -> pass; npm run lint -> pass; npm run build -> pass; CI=true npm run test:e2e -> 3 passed.
REAL INTEGRATIONS: SQLite | SANDBOX: sample family rows labeled Sample | DISABLED: email, OAuth, password reset, payments, other websites, helper invitations
FILES CHANGED: task migration, services, inbox, task room, sample page, screenshots.
OPEN BUGS/RISKS: A helper still cannot be invited. The fixed mobile bar covers the bottom of a tall viewport until you scroll. Completion is counted from current checklist status, so reopening a list removes that completion metric.
NEXT STAGE PROPOSAL: Stage 3 — one-use invitation links, a suggest grant, and immediate revoke.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```

### Stage 3

```text
PRODUCT: Tether
STAGE: 3
STATUS: PASS
USER-FACING WORKING FLOWS: An owner creates a one-use invitation link for 1, 7, or 30 days. The link is shown once. A helper reviews who invited them, the checklist, the suggest-only capability, and the expiry, then accepts. They can see the checklist and cannot mark a step done. After the owner removes access, the helper’s next load says the checklist is not available and does not show the title. A malformed or expired link says only that it is not valid.
UI/UX: Invitation form at 390px, review screen at 390px with the accept button above the mobile bar, and Trusted people at 1440px after revoke (docs/screenshots/03-*). People is the fourth nav item. Copy states that email is disabled and when the local signing key is in use.
DATA + SECURITY: invitations, trusted_relations, capability_grants. Tokens are HMAC-signed and stored as SHA-256 hashes. A bad signature is rejected before any name or title is read. Accept is one-use and transactional. Grants are checked on every read. Revoke sets revoked_at immediately; there is no cached permission. Scope is suggest only.
TESTS: npm test -> 20 passed; npm run typecheck -> pass; npm run lint -> pass; npm run build -> pass; CI=true npm run test:e2e -> 4 passed.
REAL INTEGRATIONS: SQLite | SANDBOX: sample family | DISABLED: email delivery, OAuth, password reset, payments, other websites. Invitation signing uses TETHER_INVITE_SECRET or a labeled local fallback.
FILES CHANGED: trust migration, invite and people screens, grant checks on checklist reads, screenshots.
OPEN BUGS/RISKS: A helper can look but cannot suggest yet. The local signing fallback must be replaced before any public host. Bearer links can be forwarded until they expire or are used.
NEXT STAGE PROPOSAL: Stage 4 — helper suggestions and owner approval, with the decision written to the audit log.
AWAITING APPROVAL: NO — the owner pre-approved every stage for this build.
```
