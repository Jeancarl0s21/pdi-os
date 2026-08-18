import { createHash } from "node:crypto";
import type { Seed } from "./schema";

export type EntityType =
  | "tracks"
  | "modules"
  | "topics"
  | "contents"
  | "activities"
  | "materials"
  | "projects"
  | "project_topics";
export type ManifestEntity = {
  entityType: EntityType;
  sourceKey: string;
  sourceOrder: number | null;
  parentSourceKey?: string;
  payload: Record<string, unknown>;
  sourceHash: string;
};

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
    .join(",")}}`;
}

export function sha256(value: unknown): string {
  return createHash("sha256")
    .update(typeof value === "string" ? value : canonicalJson(value))
    .digest("hex");
}

function didacticPayload(
  content: Seed["track"]["modules"][number]["topics"][number]["contents"][number],
) {
  return {
    explanation: content.explanation,
    key_points: content.key_points,
    example: content.example,
    when_to_use: content.when_to_use,
    pitfalls: content.pitfalls,
  };
}

export function buildManifest(seed: Seed): ManifestEntity[] {
  const out: ManifestEntity[] = [];
  const push = (e: Omit<ManifestEntity, "sourceHash">) =>
    out.push({ ...e, sourceHash: sha256(e.payload) });
  const trackKey = `TRACK:${seed.track.slug}`;
  push({
    entityType: "tracks",
    sourceKey: trackKey,
    sourceOrder: null,
    payload: {
      slug: seed.track.slug,
      title: seed.track.title,
      description: seed.track.description,
    },
  });

  for (const module of seed.track.modules) {
    push({
      entityType: "modules",
      sourceKey: module.id,
      sourceOrder: module.order - 1,
      parentSourceKey: trackKey,
      payload: {
        slug: module.slug,
        title: module.title,
        description: module.description,
        editorial_priority: module.priority,
        future_level_band: module.future_level_band,
      },
    });
    for (const topic of module.topics) {
      push({
        entityType: "topics",
        sourceKey: topic.id,
        sourceOrder: topic.order - 1,
        parentSourceKey: module.id,
        payload: {
          slug: topic.slug,
          title: topic.title,
          description: topic.description,
          recommended_level: topic.recommended_level,
          editorial_priority: topic.priority,
        },
      });
      for (const content of topic.contents) {
        const key = `${topic.id}-C${String(content.order).padStart(2, "0")}`;
        push({
          entityType: "contents",
          sourceKey: key,
          sourceOrder: content.order - 1,
          parentSourceKey: topic.id,
          payload: {
            title: content.title,
            didactic_payload: didacticPayload(content),
            payload_version: 1,
          },
        });
      }
      for (const activity of topic.activities) {
        push({
          entityType: "activities",
          sourceKey: activity.id,
          sourceOrder: activity.order - 1,
          parentSourceKey: topic.id,
          payload: {
            title: activity.title,
            instruction: activity.instruction,
            external_environment: activity.external_environment,
            execution_context: activity.execution_context,
            dataset_or_source: activity.dataset_or_source,
            resources: activity.resources,
            expected_output: activity.expected_output,
            suggested_evidence: activity.suggested_evidence,
            external_url: activity.external_url ?? null,
          },
        });
      }
      topic.materials.forEach((material, index) => {
        const normalizedUrl = material.url.trim().toLowerCase().replace(/\/$/, "");
        const key = `${topic.id}-MAT-${sha256(normalizedUrl).slice(0, 12).toUpperCase()}`;
        push({
          entityType: "materials",
          sourceKey: key,
          sourceOrder: index,
          parentSourceKey: topic.id,
          payload: {
            title: material.title,
            type: material.type,
            source: material.source,
            url: material.url,
          },
        });
      });
    }
  }

  seed.suggested_projects.forEach((project, index) => {
    push({
      entityType: "projects",
      sourceKey: project.id,
      sourceOrder: index,
      payload: { name: project.title, full_description: project.scope },
    });
  });

  const projectIds = new Set(seed.suggested_projects.map((p) => p.id));
  for (const module of seed.track.modules)
    for (const topic of module.topics)
      for (const projectKey of topic.suggested_projects) {
        if (!projectIds.has(projectKey))
          throw new Error(`Invalid project reference ${projectKey} in ${topic.id}`);
        const sourceKey = `PTMAP:${projectKey}:${topic.id}`;
        push({
          entityType: "project_topics",
          sourceKey,
          sourceOrder: null,
          parentSourceKey: topic.id,
          payload: { project_source_key: projectKey, topic_source_key: topic.id },
        });
      }
  return out;
}

export function manifestCounts(manifest: ManifestEntity[]) {
  return manifest.reduce<Record<string, number>>((acc, e) => {
    acc[e.entityType] = (acc[e.entityType] ?? 0) + 1;
    return acc;
  }, {});
}
