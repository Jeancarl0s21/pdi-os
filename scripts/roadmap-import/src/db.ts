import pg from "pg";
import type { ManifestEntity } from "./manifest";
import { canonicalJson, sha256 } from "./manifest";

const { Client } = pg;
type Existing = {
  id: string;
  source_key: string;
  source_hash: string | null;
  source_order: number | null;
  position?: number | null;
  [k: string]: unknown;
};
const tableColumns: Record<string, string[]> = {
  tracks: ["slug", "title", "description"],
  modules: ["slug", "title", "description", "editorial_priority", "future_level_band"],
  topics: ["slug", "title", "description", "recommended_level", "editorial_priority"],
  contents: ["title", "didactic_payload", "payload_version"],
  activities: [
    "title",
    "instruction",
    "external_environment",
    "execution_context",
    "dataset_or_source",
    "resources",
    "expected_output",
    "suggested_evidence",
    "external_url",
  ],
  materials: ["title", "type", "source", "url"],
  projects: ["name", "full_description"],
  project_topics: [],
};

function editorialHash(row: Existing, entity: ManifestEntity): string {
  const cols = tableColumns[entity.entityType] ?? [];
  const payload = Object.fromEntries(cols.map((c) => [c, row[c] ?? null]));
  return sha256(payload);
}

export type Change = {
  entityType: string;
  sourceKey: string;
  action: "INSERT" | "NOOP" | "SAFE_UPDATE" | "CONFLICT" | "TOMBSTONED";
  reason?: string;
};

async function loadExisting(
  client: pg.Client,
  userId: string,
  entity: ManifestEntity,
): Promise<Existing | null> {
  if (entity.entityType === "project_topics") {
    const [projectKey, topicKey] = [
      String(entity.payload.project_source_key),
      String(entity.payload.topic_source_key),
    ];
    const r = await client.query(
      `select pt.project_id::text as id, $4::text as source_key, null::text as source_hash, null::integer as source_order
      from public.project_topics pt join public.projects p on p.id=pt.project_id and p.user_id=pt.user_id join public.topics t on t.id=pt.topic_id and t.user_id=pt.user_id
      where pt.user_id=$1 and p.source_key=$2 and t.source_key=$3`,
      [userId, projectKey, topicKey, entity.sourceKey],
    );
    return r.rows[0] ?? null;
  }
  const r = await client.query(
    `select * from public.${entity.entityType} where user_id=$1 and source_key=$2`,
    [userId, entity.sourceKey],
  );
  return r.rows[0] ?? null;
}

async function isTombstoned(client: pg.Client, userId: string, e: ManifestEntity) {
  const entityType = e.entityType;
  const r = await client.query(
    "select 1 from public.seed_tombstones where user_id=$1 and entity_type=$2 and source_key=$3",
    [userId, entityType, e.sourceKey],
  );
  return r.rowCount !== null && r.rowCount > 0;
}

export async function planImport(dbUrl: string, userId: string, manifest: ManifestEntity[]) {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const changes: Change[] = [];
    for (const e of manifest) {
      if (await isTombstoned(client, userId, e)) {
        changes.push({ entityType: e.entityType, sourceKey: e.sourceKey, action: "TOMBSTONED" });
        continue;
      }
      const existing = await loadExisting(client, userId, e);
      if (!existing) {
        changes.push({ entityType: e.entityType, sourceKey: e.sourceKey, action: "INSERT" });
        continue;
      }
      if (e.entityType === "project_topics") {
        changes.push({ entityType: e.entityType, sourceKey: e.sourceKey, action: "NOOP" });
        continue;
      }
      if (existing.source_hash === e.sourceHash) {
        changes.push({ entityType: e.entityType, sourceKey: e.sourceKey, action: "NOOP" });
        continue;
      }
      const currentHash = editorialHash(existing, e);
      if (existing.source_hash && currentHash !== existing.source_hash)
        changes.push({
          entityType: e.entityType,
          sourceKey: e.sourceKey,
          action: "CONFLICT",
          reason: "human editorial change detected",
        });
      else
        changes.push({ entityType: e.entityType, sourceKey: e.sourceKey, action: "SAFE_UPDATE" });
    }
    return changes;
  } finally {
    await client.end();
  }
}

function identifiers(e: ManifestEntity) {
  return { table: e.entityType, columns: Object.keys(e.payload) };
}
async function resolveId(client: pg.Client, userId: string, table: string, sourceKey: string) {
  const r = await client.query(
    `select id from public.${table} where user_id=$1 and source_key=$2`,
    [userId, sourceKey],
  );
  if (!r.rows[0]) throw new Error(`Missing parent ${table}:${sourceKey}`);
  return r.rows[0].id;
}

export async function applyImport(
  dbUrl: string,
  userId: string,
  seedVersion: string,
  checksum: string,
  manifest: ManifestEntity[],
  plan: Change[],
) {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  const conflicts = plan.filter((c) => c.action === "CONFLICT");
  if (conflicts.length)
    throw new Error(
      `Refusing apply with ${conflicts.length} conflict(s). Resolve conflicts first.`,
    );
  await client.query("begin");
  try {
    const run = await client.query(
      `insert into public.seed_import_runs(user_id,seed_name,seed_version,checksum,status) values($1,'data-engineering-roadmap',$2,$3,'running') returning id`,
      [userId, seedVersion, checksum],
    );
    const runId = run.rows[0].id;
    let inserts = 0,
      updates = 0,
      noops = 0;
    for (const e of manifest) {
      const action = plan.find(
        (c) => c.entityType === e.entityType && c.sourceKey === e.sourceKey,
      )?.action;
      if (action === "NOOP" || action === "TOMBSTONED") {
        noops++;
        continue;
      }
      if (e.entityType === "project_topics") {
        if (action === "INSERT") {
          const projectId = await resolveId(
            client,
            userId,
            "projects",
            String(e.payload.project_source_key),
          );
          const topicId = await resolveId(
            client,
            userId,
            "topics",
            String(e.payload.topic_source_key),
          );
          await client.query(
            "insert into public.project_topics(user_id,project_id,topic_id) values($1,$2,$3) on conflict do nothing",
            [userId, projectId, topicId],
          );
          inserts++;
        }
        continue;
      }
      const { table, columns } = identifiers(e);
      const values = columns.map((c) => e.payload[c]);
      let parentCol: string | undefined, parentId: string | undefined;
      if (e.parentSourceKey) {
        const parents: Record<string, [string, string]> = {
          modules: ["track_id", "tracks"],
          topics: ["module_id", "modules"],
          contents: ["topic_id", "topics"],
          activities: ["topic_id", "topics"],
          materials: ["topic_id", "topics"],
        };
        const parent = parents[table];
        if (parent) {
          parentCol = parent[0];
          parentId = await resolveId(client, userId, parent[1], e.parentSourceKey);
        }
      }
      if (action === "INSERT") {
        const baseCols = ["user_id", "source_key", "source_version", "source_hash", "source_order"];
        const baseVals = [userId, e.sourceKey, seedVersion, e.sourceHash, e.sourceOrder];
        if (parentCol) {
          baseCols.push(parentCol);
          baseVals.push(parentId);
        }
        const hasPosition = ["modules", "topics", "contents", "activities", "materials"].includes(
          table,
        );
        if (hasPosition) {
          baseCols.push("position");
          baseVals.push(e.sourceOrder);
        }
        if (table === "projects") {
          baseCols.push("execution_status", "publication_status");
          baseVals.push("planned", "draft");
        }
        const allCols = [...baseCols, ...columns];
        const allVals = [...baseVals, ...values];
        await client.query(
          `insert into public.${table}(${allCols.join(",")}) values(${allVals.map((_, i) => `$${i + 1}`).join(",")})`,
          allVals,
        );
        inserts++;
      } else if (action === "SAFE_UPDATE") {
        const existing = (
          await client.query(
            `select source_order,position from public.${table} where user_id=$1 and source_key=$2 for update`,
            [userId, e.sourceKey],
          )
        ).rows[0];
        const sets = columns.map((c, i) => `${c}=$${i + 3}`);
        const vals = [userId, e.sourceKey, ...values, seedVersion, e.sourceHash, e.sourceOrder];
        let offset = 3 + values.length;
        sets.push(
          `source_version=$${offset++}`,
          `source_hash=$${offset++}`,
          `source_order=$${offset++}`,
        );
        if (
          ["modules", "topics", "contents", "activities", "materials"].includes(table) &&
          existing?.position === existing?.source_order
        ) {
          sets.push(`position=$${offset++}`);
          vals.push(e.sourceOrder);
        }
        await client.query(
          `update public.${table} set ${sets.join(",")} where user_id=$1 and source_key=$2`,
          vals,
        );
        updates++;
      }
    }
    await client.query(
      `update public.seed_import_runs set finished_at=now(),status='succeeded',insert_count=$2,update_count=$3,noop_count=$4,conflict_count=0 where id=$1`,
      [runId, inserts, updates, noops],
    );
    await client.query("commit");
    return { runId, inserts, updates, noops };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}
