"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, fieldErrorsFrom } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { validateDeclaredUpload, validateMagicBytes } from "@/lib/server/storage/policy";
import { EVIDENCE_BUCKET, evidenceObjectPath } from "./storage";
import { evidenceContext, linkEvidenceSchema } from "./schema";

export type EvidenceActionResult = ActionResult;

const idSchema = z
  .string()
  .refine((v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v));

function contextColumn(context: "activity" | "study") {
  return context === "activity" ? "activity_id" : "study_session_id";
}

function revalidate() {
  revalidatePath("/app/roadmap/[moduleId]/[topicId]", "page");
  revalidatePath("/app/estudos");
}

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function addLinkEvidence(
  _prev: EvidenceActionResult,
  formData: FormData,
): Promise<EvidenceActionResult> {
  const parsed = linkEvidenceSchema.safeParse({
    context: formData.get("context"),
    contextId: formData.get("contextId"),
    title: String(formData.get("title") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const uid = await requireUser(supabase);
  if (!uid) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase.from("evidences").insert({
    user_id: uid,
    [contextColumn(parsed.data.context)]: parsed.data.contextId,
    kind: "link",
    title: parsed.data.title,
    external_url: parsed.data.url,
  });
  if (error) return { ok: false, message: "Não foi possível adicionar a evidência." };

  revalidate();
  return { ok: true };
}

export async function addFileEvidence(
  _prev: EvidenceActionResult,
  formData: FormData,
): Promise<EvidenceActionResult> {
  const context = evidenceContext.safeParse(formData.get("context"));
  const contextId = idSchema.safeParse(formData.get("contextId"));
  if (!context.success || !contextId.success) return { ok: false, message: "Contexto inválido." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Selecione um arquivo." };

  const declared = validateDeclaredUpload("evidence", file.size, file.type);
  if (!declared.ok) {
    return {
      ok: false,
      message:
        declared.reason === "size"
          ? "Arquivo maior que 5 MB."
          : "Tipo não permitido (PDF, imagem, txt, csv, json, ipynb).",
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validateMagicBytes(file.type, bytes)) {
    return { ok: false, message: "Arquivo inválido." };
  }

  const supabase = await createClient();
  const uid = await requireUser(supabase);
  if (!uid) return { ok: false, message: "Sessão expirada." };

  const title = String(formData.get("title") ?? "").trim() || null;
  const evidenceId = crypto.randomUUID();
  const path = evidenceObjectPath(uid, evidenceId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, message: "Falha no upload do arquivo." };

  const { error } = await supabase.from("evidences").insert({
    id: evidenceId,
    user_id: uid,
    [contextColumn(context.data)]: contextId.data,
    kind: "file",
    title,
    storage_path: path,
    original_filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([path]);
    return { ok: false, message: "Não foi possível salvar a evidência." };
  }

  revalidate();
  return { ok: true };
}

export async function removeEvidence(
  _prev: EvidenceActionResult,
  formData: FormData,
): Promise<EvidenceActionResult> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Evidência inválida." };

  const supabase = await createClient();
  const uid = await requireUser(supabase);
  if (!uid) return { ok: false, message: "Sessão expirada." };

  const { data: row } = await supabase
    .from("evidences")
    .select("storage_path")
    .eq("id", id.data)
    .eq("user_id", uid)
    .maybeSingle();

  const { error } = await supabase.from("evidences").delete().eq("id", id.data).eq("user_id", uid);
  if (error) return { ok: false, message: "Não foi possível remover a evidência." };

  if (row?.storage_path) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([row.storage_path]);
  }

  revalidate();
  return { ok: true };
}
