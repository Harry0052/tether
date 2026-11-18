import type { Metadata } from "next";
import Link from "next/link";
import { TaskRoom } from "@/components/product/task-room";
import { buttonClass } from "@/components/ui/button";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listProposals, listTaskRecord } from "@/lib/proposals/service";
import { viewTask } from "@/lib/tasks/service";

export const metadata: Metadata = { title: "Checklist" };

export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await readSessionUser(getDb());
  const view = viewTask(getDb(), user?.id ?? null, id);

  if (!view) {
    return (
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-col px-4 py-16">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">This checklist is not available to you</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
          It may belong to someone else, or the address may be wrong. Tether does not show the name either way.
        </p>
        <Link href="/tasks" className={`${buttonClass("primary")} mt-8 w-fit`}>
          Back to your tasks
        </Link>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:py-12">
      <TaskRoom
        view={view}
        proposals={listProposals(getDb(), user?.id ?? null, view.task.id)}
        record={listTaskRecord(getDb(), user?.id ?? null, view.task.id)}
        alert={
          query.error === "suggestion"
            ? "That suggestion was not saved. Check the step and try again."
            : query.error === "decision"
              ? "That decision was not saved."
              : null
        }
      />
    </main>
  );
}
