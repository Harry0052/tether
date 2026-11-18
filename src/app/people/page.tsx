import type { Metadata } from "next";
import Link from "next/link";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatUtc } from "@/lib/time";
import { listTrust } from "@/lib/trust/service";

export const metadata: Metadata = { title: "Trusted people" };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ removed?: string; error?: string; cancelled?: string }>;
}) {
  const params = await searchParams;
  const user = await readSessionUser(getDb());
  const trust = user ? listTrust(getDb(), user.id) : { helpers: [], helping: [], pending: [] };

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Trusted people</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          A helper can suggest on the checklists you share. They cannot mark a step done, and you can remove access immediately.
        </p>
      </div>

      {params.removed === "1" ? (
        <p role="status" className="rounded-2xl bg-mint px-4 py-3 font-semibold">
          Access removed. Their next visit to that checklist will fail.
        </p>
      ) : null}
      {params.cancelled === "1" ? (
        <p role="status" className="rounded-2xl bg-mint px-4 py-3 font-semibold">
          Invitation cancelled. The link no longer works.
        </p>
      ) : null}
      {params.error === "confirm" ? (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-danger">
          Tick the box to confirm. Nothing was changed.
        </p>
      ) : null}
      {params.error === "unavailable" ? (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-danger">
          That access is not available to you.
        </p>
      ) : null}

      <section aria-labelledby="helpers-title">
        <h2 id="helpers-title" className="font-display text-3xl tracking-tight">
          People who can suggest
        </h2>
        {trust.helpers.length === 0 ? (
          <p className="mt-3 text-lg leading-8 text-muted">Nobody has accepted an invitation yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {trust.helpers.map((helper) => (
              <li key={helper.helperId} className="rounded-[var(--radius-card)] border border-line bg-card p-5">
                <h3 className="text-xl font-semibold">{helper.helperName}</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {helper.grants.map((grant) => (
                    <li key={grant.id} className="text-muted">
                      <Link href={`/tasks/${grant.taskId}`} className="font-semibold text-navy underline decoration-mint decoration-2 underline-offset-4">
                        {grant.taskTitle}
                      </Link>
                      {" · Suggest until "}
                      {formatUtc(grant.expiresAt, "en")}
                    </li>
                  ))}
                </ul>
                <form method="post" action={`/api/people/${helper.helperId}/revoke`} className="mt-4">
                  <label className="flex min-h-12 items-start gap-3">
                    <input type="checkbox" name="confirm" value="yes" required className="mt-1 size-5 accent-navy" />
                    <span>I understand {helper.helperName} loses access immediately.</span>
                  </label>
                  <button type="submit" className="mt-3 inline-flex min-h-12 items-center rounded-full bg-danger px-5 font-semibold text-ivory">
                    Remove access
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pending-title">
        <h2 id="pending-title" className="font-display text-3xl tracking-tight">
          Links not used yet
        </h2>
        {trust.pending.length === 0 ? (
          <p className="mt-3 leading-7 text-muted">Unused links show up here. The link text itself is not stored.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {trust.pending.map((invite) => (
              <li key={invite.id} className="rounded-[var(--radius-card)] border border-line bg-card p-5">
                <p className="font-semibold">{invite.taskTitle}</p>
                <p className="mt-1 text-muted">Suggest until {formatUtc(invite.expiresAt, "en")}. The link is not shown again.</p>
                <form method="post" action={`/api/invitations/${invite.id}/revoke`} className="mt-3">
                  <button type="submit" className="inline-flex min-h-12 items-center rounded-full bg-ivory px-5 font-semibold text-navy ring-1 ring-line">
                    Cancel invitation
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="helping-title">
        <h2 id="helping-title" className="font-display text-3xl tracking-tight">
          People you help
        </h2>
        {trust.helping.length === 0 ? (
          <p className="mt-3 leading-7 text-muted">When you accept an invitation, that person shows up here.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {trust.helping.map((row) => (
              <li key={row.ownerId} className="rounded-[var(--radius-card)] border border-line bg-card p-5">
                <h3 className="text-xl font-semibold">{row.ownerName}</h3>
                <ul className="mt-2">
                  {row.grants.map((grant) => (
                    <li key={grant.taskId}>
                      <Link href={`/tasks/${grant.taskId}`} className="font-semibold text-navy underline decoration-mint decoration-2 underline-offset-4">
                        {grant.taskTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
