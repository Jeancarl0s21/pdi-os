"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

export type RoadmapActionResult = ActionResult;

const idSchema = z.uuid();

function revalidateRoadmap() {
  revalidatePath("/app/roadmap");
  revalidatePath("/app/roadmap/[moduleId]", "page");
  revalidatePath("/app/roadmap/[moduleId]/[topicId]", "page");
  revalidatePath("/app");
}

export async function startTopic(
  _prev: RoadmapActionResult,
  formData: FormData,
): Promise<RoadmapActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Topic inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("start_topic", { p_topic_id: id.data });
  if (error) return { ok: false, message: "Não foi possível iniciar o Topic." };

  revalidateRoadmap();
  return { ok: true };
}

export async function completeTopic(
  _prev: RoadmapActionResult,
  formData: FormData,
): Promise<RoadmapActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Topic inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_topic", { p_topic_id: id.data });
  if (error) {
    if (error.code === "23514") {
      return { ok: false, message: "Conclua ao menos uma Activity antes de finalizar o Topic." };
    }
    return { ok: false, message: "Não foi possível concluir o Topic." };
  }

  revalidateRoadmap();
  return { ok: true };
}

const contentSchema = z.object({ id: z.uuid(), completed: z.enum(["true", "false"]) });

export async function setContentCompleted(
  _prev: RoadmapActionResult,
  formData: FormData,
): Promise<RoadmapActionResult> {
  const parsed = contentSchema.safeParse({
    id: formData.get("id"),
    completed: formData.get("completed"),
  });
  if (!parsed.success) return { ok: false, message: "Conteúdo inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_content_completed", {
    p_content_id: parsed.data.id,
    p_completed: parsed.data.completed === "true",
  });
  if (error) return { ok: false, message: "Não foi possível atualizar o conteúdo." };

  revalidateRoadmap();
  return { ok: true };
}

const activitySchema = z.object({ id: z.uuid(), completed: z.enum(["true", "false"]) });

export async function setActivityCompleted(
  _prev: RoadmapActionResult,
  formData: FormData,
): Promise<RoadmapActionResult> {
  const parsed = activitySchema.safeParse({
    id: formData.get("id"),
    completed: formData.get("completed"),
  });
  if (!parsed.success) return { ok: false, message: "Activity inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_activity_completed", {
    p_activity_id: parsed.data.id,
    p_completed: parsed.data.completed === "true",
  });
  if (error) return { ok: false, message: "Não foi possível atualizar a Activity." };

  revalidateRoadmap();
  return { ok: true };
}

const exposureSchema = z.object({ id: z.uuid(), authorized: z.enum(["true", "false"]) });

/**
 * Explicit public-exposure authorization for a Topic (RN-PUBLIC-STUDY-002). The
 * flag persists when the Topic leaves `studying` (RN-PUBLIC-STUDY-005); the
 * public RPC only shows it while `status = 'studying'`. Direct RLS-scoped
 * update — the topics_owner_update policy enforces ownership.
 */
export async function setTopicPublicExposure(
  _prev: RoadmapActionResult,
  formData: FormData,
): Promise<RoadmapActionResult> {
  const parsed = exposureSchema.safeParse({
    id: formData.get("id"),
    authorized: formData.get("authorized"),
  });
  if (!parsed.success) return { ok: false, message: "Topic inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase
    .from("topics")
    .update({ public_exposure_authorized: parsed.data.authorized === "true" })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível atualizar a exposição pública." };

  revalidateRoadmap();
  revalidatePath("/");
  return { ok: true };
}
