import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getMessages } from "@/lib/i18n";
import { listOwnedTasks } from "@/lib/tasks/service";

export default async function HomePage() {
  const user = await readSessionUser(getDb());
  const messages = getMessages(user?.locale);
  const named = user && user.displayName !== "Guest" ? user.displayName : null;
  const tasks = user ? listOwnedTasks(getDb(), user.id) : [];
  const latest = tasks.find((task) => task.task.status === "open") ?? tasks[0] ?? null;
  const copy = messages.home;

  return (
    <main id="main" className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:py-12">
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ok">{copy.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-navy sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">{copy.lede}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tasks/new" className={buttonClass("primary")}>
              {copy.primary}
            </Link>
            <Link href="/sample" className={buttonClass("secondary")}>
              See the sample family
            </Link>
          </div>
        </div>
        <aside className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[0_1px_0_rgba(20,37,61,0.04)]">
          {latest ? (
            <>
              <h2 className="font-display text-3xl tracking-tight">Continue your checklist</h2>
              <p className="mt-3 text-lg font-semibold">{latest.task.title}</p>
              <p className="mt-2 text-muted">
                {latest.doneCount} of {latest.steps.length} steps done. This is yours, not the sample.
              </p>
              <Link href={`/tasks/${latest.task.id}`} className={`${buttonClass("secondary")} mt-5`}>
                Open checklist
              </Link>
            </>
          ) : named ? (
            <>
              <h2 className="font-display text-3xl tracking-tight">Welcome back, {named}</h2>
              <p className="mt-3 text-lg leading-7 text-muted">
                Your name is saved on this server. You do not have a checklist yet.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl tracking-tight">This browser is new here</h2>
              <p className="mt-3 text-lg leading-7 text-muted">
                The first checklist asks what to call you. Tether keeps that name with the list. There is no password on this step.
              </p>
            </>
          )}
        </aside>
      </section>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="font-display text-3xl tracking-tight">
          {copy.stepsTitle}
        </h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="rounded-[var(--radius-card)] border border-line bg-card p-5">
              <p className="text-sm font-semibold text-ok">0{index + 1}</p>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 leading-7 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="limits-title" className="rounded-[var(--radius-card)] bg-navy px-5 py-6 text-ivory">
        <h2 id="limits-title" className="font-display text-3xl tracking-tight">
          {copy.limitsTitle}
        </h2>
        <ul className="mt-4 grid gap-3 text-base leading-7 md:grid-cols-2">
          {copy.limits.map((item) => (
            <li key={item} className="rounded-2xl bg-white/5 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
