"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { quickTaskSchema, taskFormSchema } from "./schema";

export interface TaskActionResult {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  message?: string;
}

function firstErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}

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
