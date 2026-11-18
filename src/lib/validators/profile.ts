import { z } from "zod";

const bidi = /[\u202A-\u202E\u2066-\u2069]/;

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name people will recognize.")
  .max(60, "Use 60 characters or fewer.")
  .refine((value) => !/[\u0000-\u001F\u007F]/.test(value), "That name contains a hidden character.")
  .refine((value) => !bidi.test(value), "That name contains a hidden character.");

export const profileSchema = z.object({
  displayName: displayNameSchema,
});

export function firstFieldError(error: z.ZodError, field: string) {
  return error.issues.find((issue) => issue.path[0] === field)?.message ?? "Check this field.";
}
