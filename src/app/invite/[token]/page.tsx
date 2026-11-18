import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatUtc } from "@/lib/time";
import { INVITE_INVALID, previewInvitation } from "@/lib/trust/service";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const preview = previewInvitation(getDb(), token);
  const user = await readSessionUser(getDb());
  const name = user && user.displayName !== "Guest" ? user.displayName : "";

  if (!preview.ok) {
    return (
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-col px-4 py-16">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{INVITE_INVALID}</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
          It may have expired, already been used, or been typed wrong. This page does not say who sent it.
        </p>
        <Link href="/" className={`${buttonClass("primary")} mt-8 w-fit`}>
          Back to the start
        </Link>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ok">Invitation</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Review this invitation</h1>
        <p className="mt-2 text-lg leading-7 text-muted">
          Accepting lets you suggest steps. It does not give you a password, and you cannot mark a step done.
        </p>
      </div>
      <dl className="rounded-[var(--radius-card)] border border-line bg-card px-5 py-2">
        <div className="py-1.5">
          <dt className="text-sm font-semibold text-muted">From</dt>
          <dd className="text-xl font-semibold">{preview.ownerName}</dd>
        </div>
        <div className="py-1.5">
          <dt className="text-sm font-semibold text-muted">Checklist</dt>
          <dd className="text-xl font-semibold">{preview.taskTitle}</dd>
        </div>
        <div className="py-1.5">
          <dt className="text-sm font-semibold text-muted">What you can do</dt>
          <dd className="text-xl font-semibold">Suggest only</dd>
        </div>
        <div className="py-1.5">
          <dt className="text-sm font-semibold text-muted">Stops working</dt>
          <dd className="text-xl font-semibold">{formatUtc(preview.expiresAt, "en")}</dd>
        </div>
      </dl>
      {query.error === "name" ? (
        <p role="alert" className="text-danger">
          Enter a name people will recognize.
        </p>
      ) : null}
      {query.error === "invalid" ? (
        <p role="alert" className="text-danger">
          {INVITE_INVALID}
        </p>
      ) : null}
      {query.error === "limited" ? (
        <p role="alert" className="text-danger">
          Too many invitation attempts. Wait an hour and try again.
        </p>
      ) : null}
      <form method="post" action={`/api/invitations/${encodeURIComponent(token)}/accept`} className="flex flex-col gap-2">
        <label htmlFor="displayName" className="font-semibold">
          What should we call you?
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={name}
          required
          maxLength={60}
          autoComplete="name"
          className="w-full min-h-12 rounded-2xl border border-line bg-card px-4 text-lg"
        />
        <button type="submit" className="inline-flex min-h-12 w-fit items-center rounded-full bg-navy px-5 font-semibold text-ivory">
          Accept and open the checklist
        </button>
      </form>
    </main>
  );
}
