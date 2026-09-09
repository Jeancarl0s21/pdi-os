import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StudySession, StudySessionFilters } from "./types";

const COLUMNS =
  "id,studied_on,title,note,duration_minutes,topic_id,project_id,topics(title),projects(name)";

type RawRow = {
  id: string;
  studied_on: string;
  title: string;
  note: string | null;
  duration_minutes: number | null;
  topic_id: string | null;
  project_id: string | null;
  topics: { title?: string } | { title?: string }[] | null;
  projects: { name?: string } | { name?: string }[] | null;
};

function rel<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapRow(row: RawRow): StudySession {
  return {
    id: row.id,
    studiedOn: row.studied_on,
    title: row.title,
    note: row.note,
    durationMinutes: row.duration_minutes,
    topicId: row.topic_id,
    topicTitle: rel(row.topics)?.title ?? null,
    projectId: row.project_id,
    projectName: rel(row.projects)?.name ?? null,
  };
}

/** Chronological log, most recent first (DEC-040). Filters are RN-STUDY-007. */
export async function listStudySessions(
  filters: StudySessionFilters = {},
): Promise<StudySession[]> {
  const supabase = await createClient();

  // moduleId narrows to the topics that belong to that module.
  let moduleTopicIds: string[] | null = null;
  if (filters.moduleId) {
    const { data } = await supabase.from("topics").select("id").eq("module_id", filters.moduleId);
    moduleTopicIds = (data ?? []).map((t) => t.id);
    if (moduleTopicIds.length === 0) return [];
  }

  let query = supabase
    .from("study_sessions")
    .select(COLUMNS)
    .order("studied_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("studied_on", filters.from);
  if (filters.to) query = query.lte("studied_on", filters.to);
  if (filters.noTopic) query = query.is("topic_id", null);
  else if (filters.topicId) query = query.eq("topic_id", filters.topicId);
  else if (moduleTopicIds) query = query.in("topic_id", moduleTopicIds);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as RawRow[]).map(mapRow);
}

export async function listTopicRefs(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id,title")
    .is("archived_at", null)
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { id: string; title: string }[];
}

export async function listModuleRefs(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id,title")
    .is("archived_at", null)
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { id: string; title: string }[];
}
