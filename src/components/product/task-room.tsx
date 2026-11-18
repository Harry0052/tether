import Link from "next/link";
import { InvitePanel } from "@/components/product/invite-panel";
import { StepList } from "@/components/product/step-list";
import { formatDay } from "@/lib/time";
import type { TaskView } from "@/lib/tasks/service";
import { inviteSigning } from "@/lib/trust/tokens";

export function TaskRoom({ view }: { view: TaskView }) {
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
            ? "You can only suggest. You cannot mark a step done, and you do not have a password."
            : "You are in control. Only you can mark a step done."}
      </p>

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

      <StepList
        taskId={task.id}
        steps={steps}
        canEdit={role === "owner"}
        doneLabel="Done"
        pendingLabel="Not done yet"
        markDone="Mark done"
        markNotDone="Mark not done"
      />
    </div>
  );
}
