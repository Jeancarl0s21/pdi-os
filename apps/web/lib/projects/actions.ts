"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, fieldErrorsFrom } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { projectFormSchema } from "./schema";

export type ProjectActionResult = ActionResult;

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    fullDescription: String(formData.get("fullDescription") ?? ""),
    executionStatus: String(formData.get("executionStatus") ?? "planned"),
    githubUrl: String(formData.get("githubUrl") ?? ""),
    demoUrl: String(formData.get("demoUrl") ?? ""),
    projectDate: String(formData.get("projectDate") ?? ""),
    technologies: formData.getAll("technologies").map(String),
  };
}

function rpcArgs(values: z.infer<typeof projectFormSchema>) {
  return {
    p_name: values.name,
    p_short_description: values.shortDescription,
    p_full_description: values.fullDescription,
    p_github_url: values.githubUrl,
    p_demo_url: values.demoUrl,
    p_project_date: values.projectDate,
    p_execution_status: values.executionStatus,
    p_technologies: values.technologies,
  };
}

function revalidateProjects() {
  revalidatePath("/app/projetos");
  revalidatePath("/app/projetos/[id]", "page");
  revalidatePath("/app");
}

export async function createProject(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const parsed = projectFormSchema.safeParse(readForm(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_project", rpcArgs(parsed.data));
  const created = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
  if (error || !created?.id) return { ok: false, message: "Não foi possível criar o Project." };

  revalidateProjects();
  redirect(`/app/projetos/${created.id}`);
}

export async function updateProject(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const input = readForm(formData);
  if (!z.uuid().safeParse(input.id).success) return { ok: false, message: "Project inválido." };

  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_project", {
    p_project_id: input.id,
    ...rpcArgs(parsed.data),
  });
  if (error) return { ok: false, message: "Não foi possível salvar o Project." };

  revalidateProjects();
  return { ok: true };
}

const idSchema = z.uuid();

export async function archiveProject(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Project inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_project", { p_project_id: id.data });
  if (error) return { ok: false, message: "Não foi possível arquivar o Project." };

  revalidateProjects();
  return { ok: true };
}

export async function restoreProject(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Project inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_project", {
    p_project_id: id.data,
    p_execution_status: "planned",
  });
  if (error) return { ok: false, message: "Não foi possível restaurar o Project." };

  revalidateProjects();
  return { ok: true };
}
