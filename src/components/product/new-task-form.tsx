"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TaskTemplate } from "@/lib/tasks/templates";

type FieldErrors = Partial<Record<"displayName" | "title" | "dueOn" | "customSteps" | "templateType", string>>;

export function NewTaskForm({
  templates,
  needsName,
  defaultName,
}: {
  templates: TaskTemplate[];
  needsName: boolean;
  defaultName: string;
}) {
  const router = useRouter();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [templateType, setTemplateType] = useState(templates[0]?.id ?? "custom");
  const [title, setTitle] = useState(templates[0]?.title ?? "");
  const [dueOn, setDueOn] = useState("");
  const [customSteps, setCustomSteps] = useState("");
  const [displayName, setDisplayName] = useState(defaultName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  const selected = templates.find((template) => template.id === templateType) ?? templates[0];

  function chooseTemplate(template: TaskTemplate) {
    setTemplateType(template.id);
    if (template.id !== "custom") setTitle(template.title);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFields({});
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          displayName: needsName ? displayName : undefined,
          templateType,
          title,
          dueOn,
          customSteps: templateType === "custom" ? customSteps : undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        taskId?: string;
        error?: { message?: string; fields?: FieldErrors };
      } | null;
      if (!response.ok || !data?.taskId) {
        setError(data?.error?.message ?? "The checklist was not saved.");
        setFields(data?.error?.fields ?? {});
        setPending(false);
        return;
      }
      router.push(`/tasks/${data.taskId}`);
      router.refresh();
    } catch {
      setError("You appear to be offline. Nothing was saved. Try again when you are connected.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {error ? (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-danger">
          {error}
        </p>
      ) : null}

      {needsName ? (
        <div>
          <label htmlFor="displayName" className="text-base font-semibold">
            What should we call you?
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            maxLength={60}
            aria-invalid={Boolean(fields.displayName)}
            aria-describedby={fields.displayName ? "displayName-error" : undefined}
            className="mt-2 w-full min-h-12 rounded-2xl border border-line bg-card px-4 text-lg"
          />
          {fields.displayName ? (
            <p id="displayName-error" className="mt-2 text-danger">
              {fields.displayName}
            </p>
          ) : null}
        </div>
      ) : null}

      <fieldset>
        <legend className="text-base font-semibold">What kind of help is this?</legend>
        <div className="mt-3 grid gap-3">
          {templates.map((template) => {
            const active = template.id === templateType;
            return (
              <label
                key={template.id}
                className={`block min-h-12 cursor-pointer rounded-2xl border px-4 py-3 ${
                  active ? "border-navy bg-mint" : "border-line bg-card"
                }`}
              >
                <input
                  type="radio"
                  name="templateType"
                  value={template.id}
                  checked={active}
                  onChange={() => chooseTemplate(template)}
                  className="mr-3 size-4 accent-navy"
                />
                <span className="font-semibold">{template.title}</span>
                <span className="mt-1 block pl-7 text-muted">{template.summary}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="title" className="text-base font-semibold">
          Checklist name
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          required
          aria-invalid={Boolean(fields.title)}
          aria-describedby={fields.title ? "title-error" : "title-hint"}
          className="mt-2 w-full min-h-12 rounded-2xl border border-line bg-card px-4 text-lg"
        />
        <p id="title-hint" className="mt-2 text-muted">
          Use words you would say out loud.
        </p>
        {fields.title ? (
          <p id="title-error" className="mt-2 text-danger">
            {fields.title}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="dueOn" className="text-base font-semibold">
          Due date
        </label>
        <input
          id="dueOn"
          type="date"
          value={dueOn}
          onChange={(event) => setDueOn(event.target.value)}
          aria-invalid={Boolean(fields.dueOn)}
          aria-describedby={fields.dueOn ? "dueOn-error" : "dueOn-hint"}
          className="mt-2 w-full min-h-12 rounded-2xl border border-line bg-card px-4 text-lg"
        />
        <p id="dueOn-hint" className="mt-2 text-muted">
          Optional. The date is stored as a calendar day and shown in UTC.
        </p>
        {fields.dueOn ? (
          <p id="dueOn-error" className="mt-2 text-danger">
            {fields.dueOn}
          </p>
        ) : null}
      </div>

      {templateType === "custom" ? (
        <div>
          <label htmlFor="customSteps" className="text-base font-semibold">
            Steps
          </label>
          <textarea
            id="customSteps"
            value={customSteps}
            onChange={(event) => setCustomSteps(event.target.value)}
            rows={6}
            aria-invalid={Boolean(fields.customSteps)}
            aria-describedby={fields.customSteps ? "customSteps-error" : "customSteps-hint"}
            className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-3 text-lg leading-7"
          />
          <p id="customSteps-hint" className="mt-2 text-muted">
            One step on each line. Eight steps at most. {selected?.summary}
          </p>
          {fields.customSteps ? (
            <p id="customSteps-error" className="mt-2 text-danger">
              {fields.customSteps}
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <h2 className="text-base font-semibold">Steps Tether will save</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-lg leading-7">
            {selected?.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-5 text-base font-semibold text-ivory disabled:opacity-50"
      >
        {pending ? "Saving…" : "Create checklist"}
      </button>
    </form>
  );
}
