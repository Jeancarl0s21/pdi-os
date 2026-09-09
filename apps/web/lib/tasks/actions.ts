"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TASK_STATUSES } from "@pdi-os/domain";
import { type ActionResult, fieldErrorsFrom } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { quickTaskSchema, taskFormSchema } from "./schema";

const APPEND_POSITION = 2_147_483_647;

export type TaskActionResult = ActionResult;

const firstErrors = fieldErrorsFrom;

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    priority: String(formData.get("priority") ?? "medium"),
    status: String(formData.get("status") ?? "backlog"),
    dueDate: String(formData.get("dueDate") ?? ""),
    tags: formData.getAll("tags").map(String),
  };
}

function rpcArgs(values: z.infer<typeof taskFormSchema>) {
  return {
    p_title: values.title,
    p_description: values.description,
    p_category: values.category,
    p_priority: values.priority,
    p_status: values.status,
    p_due_date: values.dueDate,
    p_tag_names: values.tags,
  };
}

function revalidateTasks() {
  revalidatePath("/app/tarefas");
  revalidatePath("/app/tarefas/arquivadas");
  revalidatePath("/app/planejamento");
  revalidatePath("/app");
}

export async function createQuickTask(
  _prev: TaskActionResult,
  formData: FormData,
): Promise<TaskActionResult> {
  const parsed = quickTaskSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { ok: false, fieldErrors: firstErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_task", { p_title: parsed.data.title });
  if (error) return { ok: false, message: "Não foi possível criar a Task." };

  revalidateTasks();
  return { ok: true };
}

export async function createTask(
  _prev: TaskActionResult,
  formData: FormData,
): Promise<TaskActionResult> {
  const parsed = taskFormSchema.safeParse(readForm(formData));
  if (!parsed.success) return { ok: false, fieldErrors: firstErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_task", rpcArgs(parsed.data));
  if (error) return { ok: false, message: "Não foi possível criar a Task." };

  revalidateTasks();
  return { ok: true };
}

export async function updateTask(
  _prev: TaskActionResult,
  formData: FormData,
): Promise<TaskActionResult> {
  const input = readForm(formData);
  if (!z.uuid().safeParse(input.id).success) {
    return { ok: false, message: "Task inválida." };
  }
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: firstErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_task", {
    p_task_id: input.id,
    ...rpcArgs(parsed.data),
  });
  if (error) return { ok: false, message: "Não foi possível salvar a Task." };

  revalidateTasks();
  return { ok: true };
}

const taskIdSchema = z.uuid();
const moveSchema = z.object({ id: z.uuid(), status: z.enum(TASK_STATUSES) });

export async function moveTask(
  _prev: TaskActionResult,
  formData: FormData,
): Promise<TaskActionResult> {
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, message: "Movimento inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("move_task", {
    p_task_id: parsed.data.id,
    p_target_status: parsed.data.status,
    p_target_position: APPEND_POSITION,
  });
  if (error) return { ok: false, message: "Não foi possível mover a Task." };

  revalidateTasks();
  return { ok: true };
}

export async function archiveTask(
  _prev: TaskActionResult,
  formData: FormData,
): Promise<TaskActionResult> {
  const id = taskIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Task inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_task", { p_task_id: id.data });
  if (error) return { ok: false, message: "Não foi possível arquivar a Task." };

  revalidateTasks();
  return { ok: true };
}

export async function restoreTask(
  _prev: TaskActionResult,
  formData: FormData,
): Promise<TaskActionResult> {
  const id = taskIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Task inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_task", { p_task_id: id.data });
  if (error) return { ok: false, message: "Não foi possível restaurar a Task." };

  revalidateTasks();
  return { ok: true };
}
