import { z } from "zod";

const uuid = z
  .string()
  .refine((v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v));

export const evidenceContext = z.enum(["activity", "study"]);

export const linkEvidenceSchema = z.object({
  context: evidenceContext,
  contextId: uuid,
  title: z
    .string()
    .trim()
    .max(200)
    .transform((v) => (v === "" ? null : v)),
  url: z
    .string()
    .trim()
    .refine((v) => /^https?:\/\/\S+$/i.test(v), "Informe uma URL válida."),
});
export type LinkEvidenceValues = z.infer<typeof linkEvidenceSchema>;
