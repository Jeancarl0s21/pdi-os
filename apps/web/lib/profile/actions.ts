"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fieldErrorsFrom } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { linkFormSchema, profileFormSchema, stackItemFormSchema, statusFormSchema } from "./schema";

export type ProfileActionResult = ActionResult;

const idSchema = z.uuid();

/** The public landing and every private editor read from the same rows. */
function revalidateProfile() {
  revalidatePath("/");
  revalidatePath("/app/perfil");
  revalidatePath("/app/projetos/[id]/preview", "page");
}

async function clientAndUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function updateProfile(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = profileFormSchema.safeParse({
    name: formData.get("name") ?? "",
    headline: formData.get("headline") ?? "",
    intro: formData.get("intro") ?? "",
    about: formData.get("about") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const { supabase, userId } = await clientAndUser();
  if (!userId) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase
    .from("portfolio_profiles")
    .upsert({ user_id: userId, ...parsed.data }, { onConflict: "user_id" });
  if (error) return { ok: false, message: "Não foi possível salvar o perfil." };

  revalidateProfile();
  return { ok: true };
}

export async function updateStatus(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = statusFormSchema.safeParse({
    company: formData.get("company") ?? "",
    role: formData.get("role") ?? "",
    focus: formData.get("focus") ?? "",
    buildingText: formData.get("buildingText") ?? "",
    currentProjectId: formData.get("currentProjectId") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  // portfolio_status has a CHECK: not (current_project_id is not null and building_text is not null).
  const building = parsed.data.buildingText;
  const projectId = building ? null : parsed.data.currentProjectId;

  const { supabase, userId } = await clientAndUser();
  if (!userId) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase.from("portfolio_status").upsert(
    {
      user_id: userId,
      company: parsed.data.company,
      role: parsed.data.role,
      focus: parsed.data.focus,
      building_text: building,
      current_project_id: projectId,
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, message: "Não foi possível salvar o status." };

  revalidateProfile();
  return { ok: true };
}

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "portfolio_links" | "stack_items",
): Promise<number> {
  const { data } = await supabase
    .from(table)
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

export async function saveLink(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = linkFormSchema.safeParse({
    id: formData.get("id") ?? "",
    type: formData.get("type") ?? "",
    label: formData.get("label") ?? "",
    href: formData.get("href") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const { supabase, userId } = await clientAndUser();
  if (!userId) return { ok: false, message: "Sessão expirada." };

  const { id, ...fields } = parsed.data;
  if (id) {
    if (!idSchema.safeParse(id).success) return { ok: false, message: "Link inválido." };
    const { error } = await supabase
      .from("portfolio_links")
      .update(fields)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, message: "Não foi possível salvar o link." };
  } else {
    const { error } = await supabase.from("portfolio_links").insert({
      user_id: userId,
      ...fields,
      position: await nextPosition(supabase, "portfolio_links"),
    });
    if (error) return { ok: false, message: "Não foi possível adicionar o link." };
  }

  revalidateProfile();
  return { ok: true };
}

export async function removeLink(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Link inválido." };

  const { supabase, userId } = await clientAndUser();
  if (!userId) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase
    .from("portfolio_links")
    .delete()
    .eq("id", id.data)
    .eq("user_id", userId);
  if (error) return { ok: false, message: "Não foi possível remover o link." };

  revalidateProfile();
  return { ok: true };
}

export async function saveStackItem(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = stackItemFormSchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name") ?? "",
    groupName: formData.get("groupName") ?? "",
    isFeatured: formData.get("isFeatured") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const { supabase, userId } = await clientAndUser();
  if (!userId) return { ok: false, message: "Sessão expirada." };

  const { id, isFeatured, groupName, name } = parsed.data;
  const fields = { name, group_name: groupName, is_featured: isFeatured };
  if (id) {
    if (!idSchema.safeParse(id).success) return { ok: false, message: "Item inválido." };
    const { error } = await supabase
      .from("stack_items")
      .update(fields)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, message: "Não foi possível salvar o item." };
  } else {
    const { error } = await supabase.from("stack_items").insert({
      user_id: userId,
      ...fields,
      position: await nextPosition(supabase, "stack_items"),
    });
    if (error) return { ok: false, message: "Não foi possível adicionar o item." };
  }

  revalidateProfile();
  return { ok: true };
}

export async function removeStackItem(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Item inválido." };

  const { supabase, userId } = await clientAndUser();
  if (!userId) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase
    .from("stack_items")
    .delete()
    .eq("id", id.data)
    .eq("user_id", userId);
  if (error) return { ok: false, message: "Não foi possível remover o item." };

  revalidateProfile();
  return { ok: true };
}
