import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine(
    (value) =>
      value === null ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
    "Referência inválida.",
  );

export const studySessionFormSchema = z.object({
  studiedOn: z
    .string()
    .trim()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Informe a data do estudo."),
  title: z.string().trim().min(1, "Informe o assunto.").max(200, "Assunto muito longo."),
  note: optionalText(4000),
  durationMinutes: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine(
      (value) => value === null || (Number.isInteger(value) && value > 0 && value <= 1440),
      "Duração inválida.",
    ),
  topicId: optionalUuid,
  projectId: optionalUuid,
});

export type StudySessionFormValues = z.infer<typeof studySessionFormSchema>;
