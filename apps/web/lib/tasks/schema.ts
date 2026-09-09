import { z } from "zod";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@pdi-os/domain";

const title = z.string().trim().min(1, "Informe um título.").max(200, "Título muito longo.");

const tags = z
  .array(z.string().trim().min(1).max(50))
  .max(20, "Máximo de 20 tags.")
  .transform((values) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of values) {
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
    return out;
  });

const dueDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida.")
  .transform((value) => (value === "" ? null : value));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

export const quickTaskSchema = z.object({ title });

export const taskFormSchema = z.object({
  title,
  description: optionalText(2000),
  category: z
    .string()
    .transform((value) => (value === "" ? null : value))
    .refine(
      (value) => value === null || (TASK_CATEGORIES as readonly string[]).includes(value),
      "Categoria inválida.",
    ),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  dueDate,
  tags,
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
