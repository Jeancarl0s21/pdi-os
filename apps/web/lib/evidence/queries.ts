import "server-only";
import { createClient } from "@/lib/supabase/server";
import { EVIDENCE_BUCKET, EVIDENCE_SIGNED_URL_TTL } from "./storage";
import type { Evidence, EvidenceContext } from "./types";

function contextColumn(context: EvidenceContext): "activity_id" | "study_session_id" {
  return context === "activity" ? "activity_id" : "study_session_id";
}

type RawEvidence = {
  id: string;
  kind: "link" | "file";
  title: string | null;
  external_url: string | null;
  storage_path: string | null;
  original_filename: string | null;
};

type RawEvidenceWithContext = RawEvidence & {
  activity_id?: string | null;
  study_session_id?: string | null;
};

async function mapWithSignedUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RawEvidence[],
): Promise<Evidence[]> {
  const out: Evidence[] = [];
  for (const row of rows) {
    let fileUrl: string | null = null;
    if (row.kind === "file" && row.storage_path) {
      const { data: signed } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(row.storage_path, EVIDENCE_SIGNED_URL_TTL);
      fileUrl = signed?.signedUrl ?? null;
    }
    out.push({
      id: row.id,
      kind: row.kind,
      title: row.title,
      externalUrl: row.external_url,
      fileName: row.original_filename,
      fileUrl,
    });
  }
  return out;
}

const COLUMNS = "id,kind,title,external_url,storage_path,original_filename,created_at";

export async function listEvidence(
  context: EvidenceContext,
  contextId: string,
): Promise<Evidence[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evidences")
    .select(COLUMNS)
    .eq(contextColumn(context), contextId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return mapWithSignedUrls(supabase, (data ?? []) as RawEvidence[]);
}

/** Evidence for many contexts of the same kind, grouped by context id (one query). */
export async function listEvidenceByContext(
  context: EvidenceContext,
  contextIds: string[],
): Promise<Map<string, Evidence[]>> {
  const grouped = new Map<string, Evidence[]>();
  if (contextIds.length === 0) return grouped;

  const supabase = await createClient();
  const column = contextColumn(context);
  const { data, error } = await supabase
    .from("evidences")
    .select(`${COLUMNS},${column}`)
    .in(column, contextIds)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as RawEvidenceWithContext[];
  const mapped = await mapWithSignedUrls(supabase, rows);
  rows.forEach((row, i) => {
    const key = context === "activity" ? row.activity_id : row.study_session_id;
    if (!key) return;
    grouped.set(key, [...(grouped.get(key) ?? []), mapped[i]]);
  });
  return grouped;
}
