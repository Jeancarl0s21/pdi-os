"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, fieldErrorsFrom } from "@/lib/action-result";
import { validateDeclaredUpload, validateMagicBytes } from "@/lib/server/storage/policy";
import { createClient } from "@/lib/supabase/server";
import { projectFormSchema } from "./schema";
import { COVER_BUCKET, coverObjectPath, mirrorCoverToPublic } from "./storage";

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
  revalidatePath("/app/projetos/[id]/preview", "page");
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

export async function uploadProjectCover(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Project inválido." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Selecione uma imagem." };
  }

  const declared = validateDeclaredUpload("projectCover", file.size, file.type);
  if (!declared.ok) {
    return {
      ok: false,
      message: declared.reason === "size" ? "Imagem maior que 5 MB." : "Use PNG, JPG ou WebP.",
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validateMagicBytes(file.type, bytes)) {
    return { ok: false, message: "Arquivo de imagem inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  const path = coverObjectPath(user.id, id.data);
  const { error: uploadError } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) return { ok: false, message: "Falha no upload da capa." };

  const { data: project, error: updateError } = await supabase
    .from("projects")
    .update({ cover_path: path })
    .eq("id", id.data)
    .select("publication_status")
    .single();
  if (updateError || !project) return { ok: false, message: "Falha ao salvar a capa." };

  if (project.publication_status === "published") {
    try {
      await mirrorCoverToPublic(supabase, path);
    } catch {
      // best effort — the public copy can be re-synced by saving again
    }
  }

  revalidateProjects();
  return { ok: true };
}

export async function removeProjectCover(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Project inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  await supabase.storage.from(COVER_BUCKET).remove([coverObjectPath(user.id, id.data)]);
  const { error } = await supabase.from("projects").update({ cover_path: null }).eq("id", id.data);
  if (error) return { ok: false, message: "Falha ao remover a capa." };

  revalidateProjects();
  return { ok: true };
}

export async function publishProject(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Project inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_project", { p_project_id: id.data });
  if (error) {
    return {
      ok: false,
      message:
        error.code === "23514" ? "Faltam requisitos para publicar." : "Não foi possível publicar.",
    };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("cover_path")
    .eq("id", id.data)
    .single();
  if (project?.cover_path) {
    try {
      await mirrorCoverToPublic(supabase, project.cover_path);
    } catch {
      // best effort
    }
  }

  revalidateProjects();
  return { ok: true };
}

export async function unpublishProject(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Project inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("unpublish_project", { p_project_id: id.data });
  if (error) return { ok: false, message: "Não foi possível despublicar." };

  revalidateProjects();
  return { ok: true };
}
