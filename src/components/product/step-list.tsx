export type StepItem = {
  id: string;
  instruction: string;
  status: string;
};

export function StepList({
  taskId,
  steps,
  canEdit,
  doneLabel,
  pendingLabel,
  markDone,
  markNotDone,
}: {
  taskId: string;
  steps: StepItem[];
  canEdit: boolean;
  doneLabel: string;
  pendingLabel: string;
  markDone: string;
  markNotDone: string;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => {
        const done = step.status === "done";
        const action = done ? markNotDone : markDone;
        return (
          <li key={step.id} className="rounded-[var(--radius-card)] border border-line bg-card p-4">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  done ? "bg-mint text-navy" : "bg-ivory text-navy ring-1 ring-line"
                }`}
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-7">{step.instruction}</h3>
                <p className={`mt-1 text-sm font-semibold ${done ? "text-ok" : "text-muted"}`}>
                  {done ? doneLabel : pendingLabel}
                </p>
                {canEdit ? (
                  <form method="post" action={`/api/tasks/${taskId}/steps/${step.id}`} className="mt-3">
                    <input type="hidden" name="done" value={done ? "false" : "true"} />
                    <button
                      type="submit"
                      aria-label={`${action}: ${step.instruction}`}
                      className="inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-ivory"
                    >
                      {action}
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
