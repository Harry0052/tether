import { z } from "zod";
import { TEMPLATE_IDS } from "@/lib/tasks/templates";
import { displayNameSchema } from "@/lib/validators/profile";

function realDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  const now = new Date();
  const min = Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate());
  const max = Date.UTC(now.getUTCFullYear() + 2, now.getUTCMonth(), now.getUTCDate());
  const stamp = Date.UTC(year, month - 1, day);
  return stamp >= min && stamp <= max;
}

export const createTaskSchema = z.object({
  displayName: z.string().optional(),
  templateType: z.enum(TEMPLATE_IDS),
  title: z.string().trim().min(1, "Give the checklist a name.").max(120, "Use 120 characters or fewer."),
  dueOn: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value === "" || realDay(value), "Choose a real date within the past year or the next two years."),
  customSteps: z.string().max(2000).optional(),
});

export const optionalDisplayName = displayNameSchema;

export function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}
