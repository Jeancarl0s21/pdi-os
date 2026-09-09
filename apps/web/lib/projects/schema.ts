import { z } from "zod";
import { PROJECT_ACTIVE_EXECUTION_STATUSES } from "@pdi-os/domain";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "URL inválida.")
  .transform((value) => (value === "" ? null : value));

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida.")
  .transform((value) => (value === "" ? null : value));

const technologies = z
  .array(z.string().trim().min(1).max(60))
  .max(30, "Máximo de 30 tecnologias.")
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

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(200, "Nome muito longo."),
  shortDescription: optionalText(300),
  fullDescription: optionalText(5000),
  executionStatus: z.enum(PROJECT_ACTIVE_EXECUTION_STATUSES),
  githubUrl: optionalUrl,
  demoUrl: optionalUrl,
  projectDate: optionalDate,
  technologies,
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
