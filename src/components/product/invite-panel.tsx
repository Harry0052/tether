"use client";

import { useState, type FormEvent } from "react";

export function InvitePanel({ taskId, note }: { taskId: string; note: string }) {
  const [days, setDays] = useState("7");
  const [link, setLink] = useState<string | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setCopied(false);
    try {
      const response = await fetch(`/api/tasks/${taskId}/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ days: Number(days) }),
      });
      const data = (await response.json().catch(() => null)) as {
        token?: string;
        expiresAt?: string;
        error?: { message?: string };
      } | null;
      if (!response.ok || !data?.token || !data.expiresAt) {
        setError(data?.error?.message ?? "The invitation was not created.");
        setPending(false);
        return;
      }
      setLink(`${window.location.origin}/invite/${data.token}`);
      setExpires(data.expiresAt);
      setPending(false);
    } catch {
      setError("You appear to be offline. No invitation was created.");
      setPending(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Select the link and copy it. This browser did not allow automatic copy.");
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-card p-5" aria-labelledby="invite-title">
      <h2 id="invite-title" className="font-display text-3xl tracking-tight">
        Invite one helper
      </h2>
      <p className="mt-2 leading-7 text-muted">{note}</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="days" className="text-base font-semibold">
            Access lasts
          </label>
          <select
            id="days"
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className="mt-2 w-full min-h-12 rounded-2xl border border-line bg-ivory px-4 text-lg"
          >
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-5 font-semibold text-ivory disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create an invitation link"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      ) : null}
      {link ? (
        <div className="mt-4">
          <label htmlFor="invite-link" className="font-semibold">
            Copy this link now
          </label>
          <p id="invite-link-hint" className="mt-1 text-muted">
            Tether stores only a hash, so a refresh will not show the link again.
            {expires ? ` It stops working ${expires} UTC.` : ""}
          </p>
          <input
            id="invite-link"
            readOnly
            value={link}
            aria-describedby="invite-link-hint"
            className="mt-2 w-full min-h-12 rounded-2xl border border-line bg-ivory px-4 text-base"
          />
          <button type="button" onClick={copy} className="mt-3 inline-flex min-h-12 items-center rounded-full bg-mint px-5 font-semibold text-navy">
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
