import type { Metadata } from "next";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getMessages } from "@/lib/i18n";
import { inviteSigning } from "@/lib/trust/tokens";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; prefs?: string }>;
}) {
  const params = await searchParams;
  const user = await readSessionUser(getDb());
  const messages = getMessages(user?.locale);
  const copy = messages.settings;
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

      <form method="post" action="/api/settings" className="rounded-[var(--radius-card)] border border-line bg-card p-5">
        <h2 className="font-display text-3xl tracking-tight">{copy.accessTitle}</h2>
        <p className="mt-2 leading-7 text-muted">{copy.accessIntro}</p>
        {params.prefs === "1" ? (
          <p role="status" className="mt-3 font-semibold text-ok">
            {copy.accessSaved}
          </p>
        ) : null}
        {params.error === "prefs" ? (
          <p role="alert" className="mt-3 text-danger">
            {copy.error}
          </p>
        ) : null}
        <fieldset className="mt-4">
          <legend className="font-semibold">{copy.textSize}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {copy.sizes.map((size) => (
              <label key={size.value} className="flex min-h-12 items-center gap-3 rounded-2xl border border-line px-3">
                <input type="radio" name="textScale" value={size.value} defaultChecked={(user?.textScale ?? "1") === size.value} className="size-5 accent-navy" />
                {size.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="font-semibold">{copy.contrast}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-line px-3">
              <input type="radio" name="contrast" value="standard" defaultChecked={(user?.contrast ?? "standard") === "standard"} className="size-5 accent-navy" />
              {copy.contrastStandard}
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-line px-3">
              <input type="radio" name="contrast" value="high" defaultChecked={user?.contrast === "high"} className="size-5 accent-navy" />
              {copy.contrastHigh}
            </label>
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="font-semibold">{copy.language}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-line px-3">
              <input type="radio" name="locale" value="en" defaultChecked={(user?.locale ?? "en") !== "es"} className="size-5 accent-navy" />
              English
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-line px-3">
              <input type="radio" name="locale" value="es" defaultChecked={user?.locale === "es"} className="size-5 accent-navy" />
              Español
            </label>
          </div>
        </fieldset>
        <label className="mt-4 flex min-h-12 items-center gap-3">
          <input type="checkbox" name="simplified" value="yes" defaultChecked={Boolean(user?.simplified)} className="size-5 accent-navy" />
          {copy.simplified}
        </label>
        <button type="submit" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-ivory">
          {copy.saveAccess}
        </button>
      </form>

      <section aria-labelledby="signing-title" className="rounded-[var(--radius-card)] border border-line bg-card p-5">
        <h2 id="signing-title" className="font-display text-3xl tracking-tight">
          Invitation links
        </h2>
        <p className="mt-3 leading-7 text-muted">
          {inviteSigning().source === "local-fallback"
            ? "This server is using the local development signing key. Invitation links work on this machine. Do not put this server on the public internet until TETHER_INVITE_SECRET is set to a unique value. The key is not shown here."
            : "Invitation links are signed with the server secret. The secret is not shown here. Tether still does not email the link."}
        </p>
      </section>

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
