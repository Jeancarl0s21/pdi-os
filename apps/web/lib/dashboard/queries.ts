import "server-only";
import {
  isTaskOverdue,
  roadmapProgress,
  type RoadmapProgress,
  type TaskPriority,
} from "@pdi-os/domain";
import { createClient } from "@/lib/supabase/server";

export interface DashboardTaskCounts {
  pending: number;
  overdue: number;
  done: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  overdue: boolean;
}

export interface DashboardStudyingTopic {
  id: string;
  moduleId: string;
  title: string;
  moduleTitle: string;
}

export interface DashboardStudySession {
  id: string;
  studiedOn: string;
  title: string;
}

export interface DashboardProject {
  id: string;
  name: string;
  executionStatus: string;
  updatedAt: string;
}

export type DashboardActivityKind = "task" | "study" | "project";
export interface DashboardActivityItem {
  kind: DashboardActivityKind;
  at: string;
  label: string;
}

export interface Dashboard {
  counts: DashboardTaskCounts;
  pendingTasks: DashboardTask[];
  studyingTopic: DashboardStudyingTopic | null;
  roadmap: RoadmapProgress;
  recentStudy: DashboardStudySession[];
  recentProjects: DashboardProject[];
  recentActivity: DashboardActivityItem[];
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export async function getDashboard(): Promise<Dashboard> {
  const supabase = await createClient();

  const [
    { data: tasks, error: tasksError },
    { data: topics, error: topicsError },
    { data: study, error: studyError },
    { data: projects, error: projectsError },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id,title,status,due_date,priority,updated_at")
      .is("archived_at", null),
    supabase
      .from("topics")
      .select("id,module_id,title,status,archived_at,updated_at,modules(title)")
      .is("archived_at", null),
    supabase
      .from("study_sessions")
      .select("id,studied_on,title,created_at")
      .order("studied_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("projects")
      .select("id,name,execution_status,updated_at")
      .neq("execution_status", "archived")
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);
  if (tasksError) throw tasksError;
  if (topicsError) throw topicsError;
  if (studyError) throw studyError;
  if (projectsError) throw projectsError;

  type TaskRow = {
    id: string;
    title: string;
    status: "backlog" | "in_progress" | "done";
    due_date: string | null;
    priority: TaskPriority;
    updated_at: string;
  };
  type TopicRow = {
    id: string;
    module_id: string;
    title: string;
    status: "not_started" | "studying" | "completed";
    updated_at: string;
    modules: { title?: string } | { title?: string }[] | null;
  };

  const taskRows = (tasks ?? []) as TaskRow[];
  const topicRows = (topics ?? []) as TopicRow[];

  const counts: DashboardTaskCounts = {
    pending: taskRows.filter((t) => t.status !== "done").length,
    overdue: taskRows.filter((t) => isTaskOverdue(t.due_date, t.status)).length,
    done: taskRows.filter((t) => t.status === "done").length,
  };

  const pendingTasks: DashboardTask[] = taskRows
    .filter((t) => t.status !== "done")
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_date,
      priority: t.priority,
      overdue: isTaskOverdue(t.due_date, t.status),
    }))
    .sort((a, b) => {
      const ad = a.dueDate ?? "9999-12-31";
      const bd = b.dueDate ?? "9999-12-31";
      if (ad !== bd) return ad < bd ? -1 : 1;
      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    })
    .slice(0, 5);

  const relTitle = (m: TopicRow["modules"]) =>
    (Array.isArray(m) ? m[0]?.title : m?.title) ?? "Módulo";

  const studying = topicRows
    .filter((t) => t.status === "studying")
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
  const studyingTopic: DashboardStudyingTopic | null = studying
    ? {
        id: studying.id,
        moduleId: studying.module_id,
        title: studying.title,
        moduleTitle: relTitle(studying.modules),
      }
    : null;

  const roadmap = roadmapProgress(topicRows.map((t) => ({ status: t.status, archivedAt: null })));

  const recentStudy: DashboardStudySession[] = (study ?? [])
    .slice(0, 4)
    .map((s) => ({ id: s.id, studiedOn: s.studied_on, title: s.title }));

  const recentProjects: DashboardProject[] = (projects ?? []).slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    executionStatus: p.execution_status,
    updatedAt: p.updated_at,
  }));

  const recentActivity: DashboardActivityItem[] = [
    ...taskRows
      .filter((t) => t.status === "done")
      .map((t) => ({
        kind: "task" as const,
        at: t.updated_at,
        label: `Task concluída · ${t.title}`,
      })),
    ...(study ?? []).map((s) => ({
      kind: "study" as const,
      at: s.created_at,
      label: `Estudo registrado · ${s.title}`,
    })),
    ...(projects ?? []).map((p) => ({
      kind: "project" as const,
      at: p.updated_at,
      label: `Project atualizado · ${p.name}`,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 6);

  return {
    counts,
    pendingTasks,
    studyingTopic,
    roadmap,
    recentStudy,
    recentProjects,
    recentActivity,
  };
}
