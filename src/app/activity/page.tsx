import type { Metadata } from "next";
import Link from "next/link";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listVisibleActivity } from "@/lib/activity";
import { getMessages } from "@/lib/i18n";
import { formatUtc } from "@/lib/time";

export const metadata: Metadata = { title: "Activity" };

const labels: Record<string, { en: string; es: string }> = {
  task_created: { en: "Checklist created", es: "Lista creada" },
  step_done: { en: "Step marked done", es: "Paso marcado hecho" },
  step_reopened: { en: "Step marked not done", es: "Paso marcado pendiente" },
  invitation_created: { en: "Invitation created", es: "Invitación creada" },
  invitation_accepted: { en: "Invitation accepted", es: "Invitación aceptada" },
  invitation_revoked: { en: "Invitation cancelled", es: "Invitación cancelada" },
  access_revoked: { en: "Access removed", es: "Acceso quitado" },
  proposal_created: { en: "Suggestion sent", es: "Propuesta enviada" },
  proposal_approved: { en: "Suggestion approved", es: "Propuesta aprobada" },
  proposal_declined: { en: "Suggestion rejected", es: "Propuesta rechazada" },
};

export default async function ActivityPage() {
  const user = await readSessionUser(getDb());
  const messages = getMessages(user?.locale);
  const locale = user?.locale === "es" ? "es" : "en";
  const events = user ? listVisibleActivity(getDb(), user.id) : [];

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{messages.activity.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{messages.activity.intro}</p>
        <p className="mt-2 text-muted">{messages.activity.hidden}</p>
      </div>
      {events.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-card px-5 py-8 text-lg">{messages.activity.empty}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-[var(--radius-card)] border border-line bg-card px-5 py-4">
              <p className="font-semibold">{labels[event.type]?.[locale] ?? event.type}</p>
              <p className="mt-1">
                <Link href={`/tasks/${event.taskId}`} className="underline decoration-mint decoration-2 underline-offset-4">
                  {event.taskTitle}
                </Link>
              </p>
              <time dateTime={event.occurredAt} className="mt-1 block text-sm text-muted">
                {formatUtc(event.occurredAt, locale)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
