import type { Metadata } from "next";
import Link from "next/link";
import { NewTaskForm } from "@/components/product/new-task-form";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { TEMPLATES } from "@/lib/tasks/templates";

export const metadata: Metadata = { title: "New checklist" };

export default async function NewTaskPage() {
  const user = await readSessionUser(getDb());
  const needsName = !user || user.displayName === "Guest";

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <div>
        <Link href="/tasks" className="text-sm font-semibold text-navy underline decoration-mint decoration-2 underline-offset-4">
          Back to tasks
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">New checklist</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          Pick a safe list or write your own. Tether will not collect a password, move money, or open another website.
        </p>
      </div>
      <NewTaskForm templates={TEMPLATES} needsName={needsName} defaultName={user && !needsName ? user.displayName : ""} />
    </main>
  );
}
