import type { Metadata } from "next";
import { TaskRoom } from "@/components/product/task-room";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getMessages } from "@/lib/i18n";
import { SAMPLE_TASK_ID, viewTask } from "@/lib/tasks/service";

export const metadata: Metadata = { title: "Sample family" };

export default async function SamplePage() {
  const user = await readSessionUser(getDb());
  const view = viewTask(getDb(), null, SAMPLE_TASK_ID);
  if (!view) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl tracking-tight">The sample checklist is not in this database</h1>
        <p className="mt-4 text-lg leading-8 text-muted">Run npm run db:setup, then open this page again.</p>
      </main>
    );
  }
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:py-12">
      <TaskRoom view={view} copy={getMessages(user?.locale).room} locale={user?.locale === "es" ? "es" : "en"} />
    </main>
  );
}
