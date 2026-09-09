"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@pdi-os/domain";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

export type RoadmapEditResult = ActionResult;

const uuid = z.uuid();
const title = z.string().trim().min(1, "Informe um título.").max(200, "Título muito longo.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? "" : value));

function revalidateRoadmap() {
  revalidatePath("/app/roadmap");
  revalidatePath("/app/roadmap/arquivados");
  revalidatePath("/app/roadmap/[moduleId]", "page");
  revalidatePath("/app/roadmap/[moduleId]/[topicId]", "page");
}

const moduleSchema = z.object({
  id: z.string().optional(),
  trackId: z.string().optional(),
  title,
  description: optionalText(2000),
});

export async function saveModule(
  _prev: RoadmapEditResult,
  formData: FormData,
): Promise<RoadmapEditResult> {
  const parsed = moduleSchema.safeParse({
    id: formData.get("id") ?? "",
    trackId: formData.get("trackId") ?? "",
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: { title: parsed.error.issues[0]?.message ?? "Inválido." } };
  }

  const supabase = await createClient();
  const { id, trackId, title: name, description } = parsed.data;

  if (id) {
    if (!uuid.safeParse(id).success) return { ok: false, message: "Module inválido." };
    const { error } = await supabase.rpc("update_module", {
      p_module_id: id,
      p_slug: slugify(name) || "module",
      p_title: name,
      p_description: description,
    });
    if (error) return { ok: false, message: "Não foi possível salvar o Module." };
  } else {
    if (!uuid.safeParse(trackId).success) return { ok: false, message: "Track inválido." };
    const { error } = await supabase.rpc("create_module", {
      p_track_id: trackId,
      p_slug: slugify(name) || "module",
      p_title: name,
      p_description: description,
    });
    if (error) return { ok: false, message: "Não foi possível criar o Module." };
  }

  revalidateRoadmap();
  return { ok: true };
}

const topicSchema = z.object({
  id: z.string().optional(),
  moduleId: z.string().optional(),
  title,
  description: optionalText(4000),
  notes: optionalText(4000),
  recommendedLevel: optionalText(80),
});

export async function saveTopic(
  _prev: RoadmapEditResult,
  formData: FormData,
): Promise<RoadmapEditResult> {
  const parsed = topicSchema.safeParse({
    id: formData.get("id") ?? "",
    moduleId: formData.get("moduleId") ?? "",
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    notes: formData.get("notes") ?? "",
    recommendedLevel: formData.get("recommendedLevel") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: { title: parsed.error.issues[0]?.message ?? "Inválido." } };
  }

  const supabase = await createClient();
  const { id, moduleId, title: name, description, notes, recommendedLevel } = parsed.data;

  if (id) {
    if (!uuid.safeParse(id).success) return { ok: false, message: "Topic inválido." };
    const { error } = await supabase.rpc("update_topic", {
      p_topic_id: id,
      p_slug: slugify(name) || "topic",
      p_title: name,
      p_description: description,
      p_notes: notes,
      p_recommended_level: recommendedLevel,
    });
    if (error) return { ok: false, message: "Não foi possível salvar o Topic." };
  } else {
    if (!uuid.safeParse(moduleId).success) return { ok: false, message: "Module inválido." };
    const { error } = await supabase.rpc("create_topic", {
      p_module_id: moduleId,
      p_slug: slugify(name) || "topic",
      p_title: name,
      p_description: description,
      p_recommended_level: recommendedLevel,
    });
    if (error) return { ok: false, message: "Não foi possível criar o Topic." };
  }

  revalidateRoadmap();
  return { ok: true };
}

function idOnly(formData: FormData) {
  return uuid.safeParse(formData.get("id"));
}

async function callWithId(
  formData: FormData,
  rpc: "archive_module" | "restore_module" | "archive_topic" | "restore_topic",
  paramName: "p_module_id" | "p_topic_id",
  failure: string,
): Promise<RoadmapEditResult> {
  const id = idOnly(formData);
  if (!id.success) return { ok: false, message: "Item inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc(rpc, { [paramName]: id.data });
  if (error) return { ok: false, message: failure };
  revalidateRoadmap();
  return { ok: true };
}

export async function archiveModule(_prev: RoadmapEditResult, formData: FormData) {
  return callWithId(
    formData,
    "archive_module",
    "p_module_id",
    "Não foi possível arquivar o Module.",
  );
}
export async function restoreModule(_prev: RoadmapEditResult, formData: FormData) {
  return callWithId(
    formData,
    "restore_module",
    "p_module_id",
    "Não foi possível restaurar o Module.",
  );
}
export async function archiveTopic(_prev: RoadmapEditResult, formData: FormData) {
  return callWithId(formData, "archive_topic", "p_topic_id", "Não foi possível arquivar o Topic.");
}
export async function restoreTopic(_prev: RoadmapEditResult, formData: FormData) {
  return callWithId(formData, "restore_topic", "p_topic_id", "Não foi possível restaurar o Topic.");
}

const moveSchema = z.object({ id: z.uuid(), position: z.coerce.number().int().min(0) });

export async function moveModule(
  _prev: RoadmapEditResult,
  formData: FormData,
): Promise<RoadmapEditResult> {
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    position: formData.get("position"),
  });
  if (!parsed.success) return { ok: false, message: "Movimento inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("move_module", {
    p_module_id: parsed.data.id,
    p_target_position: parsed.data.position,
  });
  if (error) return { ok: false, message: "Não foi possível reordenar." };
  revalidateRoadmap();
  return { ok: true };
}

export async function moveTopic(
  _prev: RoadmapEditResult,
  formData: FormData,
): Promise<RoadmapEditResult> {
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    position: formData.get("position"),
  });
  if (!parsed.success) return { ok: false, message: "Movimento inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("move_topic", {
    p_topic_id: parsed.data.id,
    p_target_position: parsed.data.position,
  });
  if (error) return { ok: false, message: "Não foi possível reordenar." };
  revalidateRoadmap();
  return { ok: true };
}
