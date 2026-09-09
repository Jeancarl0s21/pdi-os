import "server-only";
import type { ProjectExecutionStatus } from "@pdi-os/domain";
import { createClient } from "@/lib/supabase/server";
import { COVER_BUCKET, COVER_SIGNED_URL_TTL } from "./storage";
import type { Project } from "./types";

const PROJECT_COLUMNS =
  "id,name,short_description,full_description,execution_status,publication_status,github_url,demo_url,project_date,cover_path,updated_at,project_technologies(name,position)";

type RawProject = {
  id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  execution_status: ProjectExecutionStatus;
  publication_status: Project["publicationStatus"];
  github_url: string | null;
  demo_url: string | null;
  project_date: string | null;
  cover_path: string | null;
  updated_at: string;
  project_technologies: { name: string; position: number }[] | null;
};

function mapProject(row: RawProject): Project {
  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    executionStatus: row.execution_status,
    publicationStatus: row.publication_status,
    githubUrl: row.github_url,
    demoUrl: row.demo_url,
    projectDate: row.project_date,
    coverPath: row.cover_path,
    coverUrl: null,
    updatedAt: row.updated_at,
    technologies: (row.project_technologies ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((tech) => tech.name),
  };
}

export async function listProjects(
  options: { status?: ProjectExecutionStatus } = {},
): Promise<Project[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("updated_at", { ascending: false });
  // Default view hides archived projects; an explicit status filter shows exactly that status.
  query = options.status
    ? query.eq("execution_status", options.status)
    : query.neq("execution_status", "archived");

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as RawProject[]).map(mapProject);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProject(id: string): Promise<Project | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const project = mapProject(data as unknown as RawProject);
  if (project.coverPath) {
    const { data: signed } = await supabase.storage
      .from(COVER_BUCKET)
      .createSignedUrl(project.coverPath, COVER_SIGNED_URL_TTL);
    project.coverUrl = signed?.signedUrl ?? null;
  }
  return project;
}
