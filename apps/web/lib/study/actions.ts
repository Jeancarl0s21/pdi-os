"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fieldErrorsFrom } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { studySessionFormSchema } from "./schema";

export type StudyActionResult = ActionResult;

const idSchema = z.uuid();

function revalidateStudy() {
  revalidatePath("/app/estudos");
  revalidatePath("/app");
}

function readForm(formData: FormData) {
  return {
    studiedOn: String(formData.get("studiedOn") ?? ""),
    title: String(formData.get("title") ?? ""),
    note: String(formData.get("note") ?? ""),
    durationMinutes: String(formData.get("durationMinutes") ?? ""),
    topicId: String(formData.get("topicId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
  };
}

function rowFrom(values: z.infer<typeof studySessionFormSchema>) {
  return {
    studied_on: values.studiedOn,
    title: values.title,
    note: values.note,
    duration_minutes: values.durationMinutes,
    topic_id: values.topicId,
    project_id: values.projectId,
  };
}

async function userId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createStudySession(
  _prev: StudyActionResult,
  formData: FormData,
): Promise<StudyActionResult> {
  const parsed = studySessionFormSchema.safeParse(readForm(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const uid = await userId(supabase);
  if (!uid) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase
    .from("study_sessions")
    .insert({ user_id: uid, ...rowFrom(parsed.data) });
  if (error) return { ok: false, message: "Não foi possível registrar o estudo." };

  revalidateStudy();
  return { ok: true };
}

export async function updateStudySession(
  _prev: StudyActionResult,
  formData: FormData,
): Promise<StudyActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Registro inválido." };

  const parsed = studySessionFormSchema.safeParse(readForm(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const uid = await userId(supabase);
  if (!uid) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase
    .from("study_sessions")
    .update(rowFrom(parsed.data))
    .eq("id", id.data)
    .eq("user_id", uid);
  if (error) return { ok: false, message: "Não foi possível salvar o estudo." };

  revalidateStudy();
  return { ok: true };
}

export async function deleteStudySession(
  _prev: StudyActionResult,
  formData: FormData,
): Promise<StudyActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Registro inválido." };

  const supabase = await createClient();
  const uid = await userId(supabase);
  if (!uid) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase
    .from("study_sessions")
    .delete()
    .eq("id", id.data)
    .eq("user_id", uid);
  if (error) return { ok: false, message: "Não foi possível excluir o estudo." };

  revalidateStudy();
  return { ok: true };
}
