export type StepItem = {
  id: string;
  instruction: string;
  status: string;
};

export function StepList({
  taskId,
  steps,
  canEdit,
  suggest = false,
  pendingStepIds = [],
  doneLabel,
  pendingLabel,
  markDone,
  markNotDone,
}: {
  taskId: string;
  steps: StepItem[];
  canEdit: boolean;
  suggest?: boolean;
  pendingStepIds?: string[];
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
                {suggest && !done && !pendingStepIds.includes(step.id) ? (
                  <form method="post" action={`/api/tasks/${taskId}/proposals`} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="kind" value="complete_step" />
                    <input type="hidden" name="stepId" value={step.id} />
                    <label htmlFor={`note-${step.id}`} className="text-sm font-semibold">
                      Note, optional
                    </label>
                    <input
                      id={`note-${step.id}`}
                      name="body"
                      maxLength={500}
                      className="min-h-12 rounded-2xl border border-line bg-ivory px-4"
                    />
                    <button
                      type="submit"
                      aria-label={`Suggest this is done: ${step.instruction}`}
                      className="inline-flex min-h-12 w-fit items-center rounded-full bg-navy px-5 font-semibold text-ivory"
                    >
                      Suggest this is done
                    </button>
                  </form>
                ) : null}
                {suggest && pendingStepIds.includes(step.id) ? (
                  <p className="mt-3 font-semibold">Waiting for the owner.</p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
