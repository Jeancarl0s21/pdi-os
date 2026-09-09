import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max);

export const profileFormSchema = z.object({
  name: requiredText(200, "Informe um nome de exibição."),
  headline: optionalText(200),
  intro: optionalText(600),
  about: optionalText(5000),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const statusFormSchema = z.object({
  company: optionalText(200),
  role: optionalText(200),
  focus: optionalText(300),
  buildingText: optionalText(300),
  currentProjectId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine(
      (value) =>
        value === null ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
      "Projeto inválido.",
    ),
});
export type StatusFormValues = z.infer<typeof statusFormSchema>;

export const linkFormSchema = z.object({
  id: z.string().trim().optional(),
  type: optionalText(40),
  label: requiredText(80, "Informe um rótulo."),
  href: z
    .string()
    .trim()
    .refine(
      (value) => /^https?:\/\/\S+$/i.test(value) || /^mailto:\S+$/i.test(value),
      "URL inválida.",
    ),
});
export type LinkFormValues = z.infer<typeof linkFormSchema>;

export const stackItemFormSchema = z.object({
  id: z.string().trim().optional(),
  name: requiredText(80, "Informe um nome."),
  groupName: optionalText(80),
  isFeatured: z.union([z.literal("on"), z.literal("")]).transform((value) => value === "on"),
});
export type StackItemFormValues = z.infer<typeof stackItemFormSchema>;
