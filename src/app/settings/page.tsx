import type { Metadata } from "next";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getMessages } from "@/lib/i18n";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const messages = getMessages();
  const copy = messages.settings;
  const user = await readSessionUser(getDb());
  const current = user && user.displayName !== "Guest" ? user.displayName : "";
  const error = params.error === "name";
  const describedBy = [error ? "displayName-error" : null, "displayName-hint"].filter(Boolean).join(" ");

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{copy.intro}</p>
      </div>

      <form method="post" action="/api/profile" className="rounded-[var(--radius-card)] border border-line bg-card p-5">
        <label htmlFor="displayName" className="text-base font-semibold">
          {copy.nameLabel}
        </label>
        <p id="displayName-hint" className="mt-1 leading-6 text-muted">
          {copy.nameHint}
        </p>
        <input
          id="displayName"
          name="displayName"
          defaultValue={current}
          required
          maxLength={60}
          autoComplete="name"
          aria-invalid={error}
          aria-describedby={describedBy}
          className="mt-3 w-full min-h-12 rounded-2xl border border-line bg-ivory px-4 text-lg text-navy"
        />
        {error ? (
          <p id="displayName-error" role="alert" className="mt-3 text-danger">
            {copy.error}
          </p>
        ) : null}
        {params.saved === "1" && !error ? (
          <p role="status" className="mt-3 font-semibold text-ok">
            {copy.saved}
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-5 text-base font-semibold text-ivory"
        >
          {copy.save}
        </button>
      </form>

      <section aria-labelledby="disabled-title">
        <h2 id="disabled-title" className="font-display text-3xl tracking-tight">
          {copy.disabledTitle}
        </h2>
        <p className="mt-2 leading-7 text-muted">{copy.disabledIntro}</p>
        <dl className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-card">
          {copy.disabled.map((item) => (
            <div key={item.name} className="px-5 py-4">
              <dt className="font-semibold">{item.name}</dt>
              <dd className="mt-1 text-muted">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
