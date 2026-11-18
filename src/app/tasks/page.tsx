import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listHelpedTasks, listOwnedTasks } from "@/lib/tasks/service";
import { formatDay } from "@/lib/time";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const user = await readSessionUser(getDb());
  const items = user ? listOwnedTasks(getDb(), user.id) : [];
  const helping = user ? listHelpedTasks(getDb(), user.id) : [];

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Tasks</h1>
          <p className="mt-3 max-w-xl text-lg leading-8 text-muted">
            Checklists you created on this browser. A sample family is kept separate.
          </p>
        </div>
        <Link href="/tasks/new" className={buttonClass("primary")}>
          New checklist
        </Link>
      </div>

      {params.error === "unavailable" ? (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-danger">
          That checklist is not available to you. Nothing was changed.
        </p>
      ) : null}

      {items.length === 0 ? (
        <section className="rounded-[var(--radius-card)] border border-dashed border-line bg-card px-5 py-8">
          <h2 className="font-display text-3xl tracking-tight">No checklist yet</h2>
          <p className="mt-3 max-w-xl text-lg leading-8 text-muted">
            Start with something small, like a video call. Tether saves the steps on this server.
          </p>
          <Link href="/tasks/new" className={`${buttonClass("secondary")} mt-6`}>
            Start a checklist
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.task.id}>
              <Link
                href={`/tasks/${item.task.id}`}
                className="block rounded-[var(--radius-card)] border border-line bg-card px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold">{item.task.title}</h2>
                  <span className="rounded-full bg-mint px-3 py-1 text-sm font-semibold text-navy">
                    {item.task.status === "completed" ? "Complete" : "Open"}
                  </span>
                </div>
                <p className="mt-2 text-muted">
                  {item.doneCount} of {item.steps.length} steps done
                  {item.task.dueOn ? ` · Due ${formatDay(item.task.dueOn, "en")}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {helping.length > 0 ? (
        <section aria-labelledby="helping-tasks">
          <h2 id="helping-tasks" className="font-display text-3xl tracking-tight">
            Helping someone else
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {helping.map((item) => (
              <li key={item.task.id}>
                <Link href={`/tasks/${item.task.id}`} className="block rounded-[var(--radius-card)] border border-line bg-card px-5 py-4">
                  <h3 className="text-xl font-semibold">{item.task.title}</h3>
                  <p className="mt-2 text-muted">You can suggest. You cannot mark a step done.</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-muted">
        <Link href="/sample" className="font-semibold text-navy underline decoration-mint decoration-2 underline-offset-4">
          See the sample family
        </Link>
        . It is not your checklist.
      </p>
    </main>
  );
}
