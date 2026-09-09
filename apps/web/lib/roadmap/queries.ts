import "server-only";
import { parseContentDidacticBody, roadmapProgress, type TopicStatus } from "@pdi-os/domain";
import { createClient } from "@/lib/supabase/server";
import type {
  RoadmapArchived,
  RoadmapModuleDetail,
  RoadmapOverview,
  RoadmapTopicDetail,
} from "./types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TopicRow = {
  id: string;
  slug: string;
  title: string;
  status: TopicStatus;
  recommended_level: string | null;
  position: number | null;
  archived_at: string | null;
  module_id: string;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "string"
        ? item
        : typeof item === "object" && item
          ? String((item as { label?: unknown }).label ?? "")
          : "",
    )
    .filter((item) => item.trim() !== "");
}

/** The Track overview: its Modules with derived progress (RN-ROADMAP-008). */
export async function getRoadmapOverview(): Promise<RoadmapOverview> {
  const supabase = await createClient();

  const { data: tracks, error: trackError } = await supabase
    .from("tracks")
    .select("id,title,description")
    .order("source_order", { ascending: true })
    .limit(1);
  if (trackError) throw trackError;
  const track = tracks?.[0] ?? null;

  if (!track) {
    return { track: null, modules: [], progress: roadmapProgress([]) };
  }

  const { data: modules, error: moduleError } = await supabase
    .from("modules")
    .select("id,slug,title,description,editorial_priority,position")
    .eq("track_id", track.id)
    .is("archived_at", null)
    .order("position", { ascending: true });
  if (moduleError) throw moduleError;

  const { data: topics, error: topicError } = await supabase
    .from("topics")
    .select("id,module_id,status,archived_at");
  if (topicError) throw topicError;

  const topicsByModule = new Map<string, { status: TopicStatus; archivedAt: string | null }[]>();
  for (const topic of (topics ?? []) as {
    module_id: string;
    status: TopicStatus;
    archived_at: string | null;
  }[]) {
    const list = topicsByModule.get(topic.module_id) ?? [];
    list.push({ status: topic.status, archivedAt: topic.archived_at });
    topicsByModule.set(topic.module_id, list);
  }

  const moduleSummaries = (modules ?? []).map((module) => ({
    id: module.id,
    slug: module.slug,
    title: module.title,
    description: module.description,
    editorialPriority: module.editorial_priority,
    progress: roadmapProgress(topicsByModule.get(module.id) ?? []),
  }));

  return {
    track: { id: track.id, title: track.title, description: track.description },
    modules: moduleSummaries,
    progress: roadmapProgress(
      moduleSummaries.flatMap((module) => topicsByModule.get(module.id) ?? []),
    ),
  };
}

export async function getRoadmapModule(id: string): Promise<RoadmapModuleDetail | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();

  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .select("id,title,description,archived_at")
    .eq("id", id)
    .maybeSingle();
  if (moduleError) throw moduleError;
  if (!module || module.archived_at) return null;

  const { data: topics, error: topicError } = await supabase
    .from("topics")
    .select("id,slug,title,status,recommended_level,position,archived_at,module_id")
    .eq("module_id", id)
    .is("archived_at", null)
    .order("position", { ascending: true });
  if (topicError) throw topicError;

  const rows = (topics ?? []) as TopicRow[];
  return {
    id: module.id,
    title: module.title,
    description: module.description,
    progress: roadmapProgress(rows.map((t) => ({ status: t.status, archivedAt: t.archived_at }))),
    topics: rows.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      status: t.status,
      recommendedLevel: t.recommended_level,
      position: t.position ?? 0,
    })),
  };
}

export async function getRoadmapArchived(): Promise<RoadmapArchived> {
  const supabase = await createClient();

  const [{ data: modules, error: mErr }, { data: topics, error: tErr }] = await Promise.all([
    supabase
      .from("modules")
      .select("id,title,archived_at")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),
    supabase
      .from("topics")
      .select("id,title,module_id,archived_at,modules(title)")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),
  ]);
  if (mErr) throw mErr;
  if (tErr) throw tErr;

  return {
    modules: (modules ?? []).map((m) => ({ id: m.id, title: m.title })),
    topics: (topics ?? []).map((t) => {
      const rel = t.modules as { title?: string } | { title?: string }[] | null;
      const moduleTitle = Array.isArray(rel) ? rel[0]?.title : rel?.title;
      return {
        id: t.id,
        title: t.title,
        moduleId: t.module_id,
        moduleTitle: moduleTitle ?? "Módulo",
      };
    }),
  };
}

export async function getRoadmapTopic(id: string): Promise<RoadmapTopicDetail | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select(
      "id,module_id,title,description,notes,status,recommended_level,archived_at,modules(title)",
    )
    .eq("id", id)
    .maybeSingle();
  if (topicError) throw topicError;
  if (!topic || topic.archived_at) return null;

  const [{ data: contents }, { data: activities }, { data: materials }] = await Promise.all([
    supabase
      .from("contents")
      .select("id,title,completed_at,didactic_payload,position")
      .eq("topic_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("activities")
      .select(
        "id,title,instruction,external_environment,execution_context,dataset_or_source,expected_output,suggested_evidence,external_url,resources,completed_at,position",
      )
      .eq("topic_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("materials")
      .select("id,title,type,source,url,position")
      .eq("topic_id", id)
      .order("position", { ascending: true }),
  ]);

  const moduleTitle =
    (topic.modules as { title?: string } | { title?: string }[] | null) &&
    (Array.isArray(topic.modules)
      ? topic.modules[0]?.title
      : (topic.modules as { title?: string })?.title);

  return {
    id: topic.id,
    moduleId: topic.module_id,
    moduleTitle: moduleTitle ?? "Módulo",
    title: topic.title,
    description: topic.description,
    notes: topic.notes,
    status: topic.status,
    recommendedLevel: topic.recommended_level,
    contents: (contents ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      completedAt: row.completed_at,
      body: parseContentDidacticBody(row.didactic_payload),
    })),
    activities: (activities ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      instruction: row.instruction,
      externalEnvironment: row.external_environment,
      executionContext: row.execution_context,
      datasetOrSource: row.dataset_or_source,
      expectedOutput: row.expected_output,
      suggestedEvidence: row.suggested_evidence,
      externalUrl: row.external_url,
      resources: toStringArray(row.resources),
      completedAt: row.completed_at,
    })),
    materials: (materials ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      source: row.source,
      url: row.url,
    })),
  };
}
