import Link from "next/link";
import { InvitePanel } from "@/components/product/invite-panel";
import { StepList } from "@/components/product/step-list";
import type { ProposalRecord } from "@/lib/proposals/service";
import { formatDay, formatUtc } from "@/lib/time";
import type { TaskView } from "@/lib/tasks/service";
import { inviteSigning } from "@/lib/trust/tokens";

const recordLabels: Record<string, string> = {
  task_created: "Checklist created",
  step_done: "Step marked done",
  step_reopened: "Step marked not done",
  invitation_created: "Invitation created",
  invitation_accepted: "Invitation accepted",
  invitation_revoked: "Invitation cancelled",
  access_revoked: "Access removed",
  proposal_created: "Suggestion sent",
  proposal_approved: "Suggestion approved",
  proposal_declined: "Suggestion rejected",
};

function recordNote(metadataJson: string) {
  try {
    const data = JSON.parse(metadataJson) as { note?: unknown };
    return typeof data.note === "string" ? data.note : "";
  } catch {
    return "";
  }
}

export function TaskRoom({
  view,
  proposals = [],
  record = [],
  alert,
}: {
  view: TaskView;
  proposals?: ProposalRecord[];
  record?: { id: string; type: string; occurredAt: string; metadataJson: string }[];
  alert?: string | null;
}) {
  const { task, steps, doneCount, role } = view;
  const sample = role === "sample";
  const percent = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={sample ? "/" : "/tasks"} className="text-sm font-semibold text-navy underline decoration-mint decoration-2 underline-offset-4">
          {sample ? "Back to the start" : "Back to tasks"}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-mint px-3 py-1 text-sm font-semibold text-navy">
            {sample ? "Sample" : role === "helper" ? "You can suggest" : "You own this"}
          </span>
          <span className="rounded-full bg-ivory px-3 py-1 text-sm font-semibold ring-1 ring-line">
            {task.status === "completed" ? "Complete" : "Open"}
          </span>
        </div>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">{task.title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">{task.summary}</p>
        {task.dueOn ? <p className="mt-2 font-semibold">Due {formatDay(task.dueOn, "en")} (UTC)</p> : null}
      </div>

      <p className="rounded-2xl bg-mint px-4 py-3 font-semibold text-navy">
        {sample
          ? "This is the sample family. Mira is not a real person. This is not your checklist, and it cannot be changed."
          : role === "helper"
            ? "You can only suggest. The owner approves a step before it is marked done."
            : "You are in control. Only you can mark a step done."}
      </p>
      {alert ? (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-danger">
          {alert}
        </p>
      ) : null}

      {role === "owner" && task.origin === "user" ? (
        <InvitePanel
          taskId={task.id}
          note={
            inviteSigning().source === "local-fallback"
              ? "Tether does not email this link. Copy it yourself. This server is using the local development signing key, so do not put it on the public internet."
              : "Tether does not email this link. Copy it and send it yourself."
          }
        />
      ) : null}

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Progress</h2>
          <p>
            {doneCount} of {steps.length} steps done
          </p>
        </div>
        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-white ring-1 ring-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
          aria-label="Checklist progress"
        >
          <div className="h-full bg-navy" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {role === "owner" ? <SuggestionQueue proposals={proposals.filter((item) => item.status === "pending")} /> : null}

      <StepList
        taskId={task.id}
        steps={steps}
        canEdit={role === "owner"}
        suggest={role === "helper"}
        pendingStepIds={proposals.filter((item) => item.status === "pending" && item.kind === "complete_step" && item.stepId).map((item) => item.stepId as string)}
        doneLabel="Done"
        pendingLabel="Not done yet"
        markDone="Mark done"
        markNotDone="Mark not done"
      />

      {role === "helper" ? (
        <form method="post" action={`/api/tasks/${task.id}/proposals`} className="rounded-[var(--radius-card)] border border-line bg-card p-5">
          <input type="hidden" name="kind" value="comment" />
          <label htmlFor="comment" className="font-semibold">
            Leave a note
          </label>
          <p id="comment-hint" className="mt-1 text-muted">
            The owner approves the note before it stays on the checklist.
          </p>
          <textarea
            id="comment"
            name="body"
            required
            maxLength={500}
            rows={3}
            aria-describedby="comment-hint"
            className="mt-3 w-full rounded-2xl border border-line bg-ivory px-4 py-3 text-lg"
          />
          <button type="submit" className="mt-3 inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-ivory">
            Send note
          </button>
        </form>
      ) : null}

      <Notes proposals={proposals.filter((item) => item.kind === "comment" && item.status !== "pending")} />

      {role !== "sample" ? <RecordList events={record} /> : null}
    </div>
  );
}

function SuggestionQueue({ proposals }: { proposals: ProposalRecord[] }) {
  if (proposals.length === 0) return null;
  return (
    <section aria-labelledby="waiting-title" className="flex flex-col gap-3">
      <h2 id="waiting-title" className="font-display text-3xl tracking-tight">
        Waiting for you
      </h2>
      {proposals.map((proposal) => {
        const label = proposal.kind === "complete_step" ? proposal.stepInstruction ?? "A step" : "A note";
        return (
          <article key={proposal.id} className="rounded-[var(--radius-card)] border border-line bg-card p-4">
            <p className="font-semibold">{proposal.authorName}</p>
            <p className="mt-1">
              {proposal.kind === "complete_step" ? `Suggests marking “${label}” done.` : "Left a note."}
            </p>
            {proposal.body ? <p className="mt-2 text-muted">{proposal.body}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <form method="post" action={`/api/proposals/${proposal.id}/decision`}>
                <input type="hidden" name="decision" value="approved" />
                <button type="submit" className="inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-ivory">
                  Approve: {label}
                </button>
              </form>
              <form method="post" action={`/api/proposals/${proposal.id}/decision`}>
                <input type="hidden" name="decision" value="declined" />
                <button type="submit" className="inline-flex min-h-12 items-center rounded-full bg-ivory px-5 font-semibold text-navy ring-1 ring-line">
                  Reject: {label}
                </button>
              </form>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function Notes({ proposals }: { proposals: ProposalRecord[] }) {
  if (proposals.length === 0) return null;
  return (
    <section aria-labelledby="notes-title">
      <h2 id="notes-title" className="font-display text-3xl tracking-tight">
        Notes
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {proposals.map((proposal) => (
          <li key={proposal.id} className="rounded-2xl border border-line bg-card px-4 py-3">
            <p className="font-semibold">
              {proposal.authorName} · {proposal.status === "approved" ? "Approved" : "Rejected"}
            </p>
            <p className="mt-1">{proposal.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecordList({ events }: { events: { id: string; type: string; occurredAt: string; metadataJson: string }[] }) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="record-title">
      <h2 id="record-title" className="font-display text-3xl tracking-tight">
        Record
      </h2>
      <p className="mt-2 text-muted">Saved on this server. Passwords are not kept in this list.</p>
      <ol className="mt-3 flex flex-col gap-2">
        {events.map((event) => {
          const note = recordNote(event.metadataJson);
          return (
            <li key={event.id} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
              <p className="font-semibold">{recordLabels[event.type] ?? event.type}</p>
              <p className="text-sm text-muted">{formatUtc(event.occurredAt, "en")}</p>
              {note ? <p className="mt-1">{note}</p> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
