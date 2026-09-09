export const TASK_STATUSES = ["backlog", "in_progress", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const TASK_CATEGORIES = ["work", "study", "project", "personal"] as const;
export const TOPIC_STATUSES = ["not_started", "studying", "completed"] as const;
export const PROJECT_EXECUTION_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "archived",
] as const;
export const PROJECT_PUBLICATION_STATUSES = ["draft", "published"] as const;

/** Execution statuses a Project can be set to from the editor (archive is an action). */
export const PROJECT_ACTIVE_EXECUTION_STATUSES = ["planned", "in_progress", "completed"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TopicStatus = (typeof TOPIC_STATUSES)[number];
export type ProjectExecutionStatus = (typeof PROJECT_EXECUTION_STATUSES)[number];
export type ProjectPublicationStatus = (typeof PROJECT_PUBLICATION_STATUSES)[number];

// UI labels (PT-BR). The stored vocabulary stays English (architecture contract).
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "Em andamento",
  done: "Concluída",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  work: "Trabalho",
  study: "Estudo",
  project: "Projeto",
  personal: "Pessoal",
};

export const PROJECT_EXECUTION_STATUS_LABELS: Record<ProjectExecutionStatus, string> = {
  planned: "Planejado",
  in_progress: "Em desenvolvimento",
  completed: "Concluído",
  archived: "Arquivado",
};

export const PROJECT_PUBLICATION_STATUS_LABELS: Record<ProjectPublicationStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
};

// Publication requirements — mirrors the public.publish_project invariant.
export const PROJECT_PUBLISH_REQUIREMENTS = [
  "shortDescription",
  "fullDescription",
  "technologies",
  "cover",
] as const;
export type ProjectPublishRequirement = (typeof PROJECT_PUBLISH_REQUIREMENTS)[number];

export const PROJECT_PUBLISH_REQUIREMENT_LABELS: Record<ProjectPublishRequirement, string> = {
  shortDescription: "Descrição curta",
  fullDescription: "Descrição completa",
  technologies: "Ao menos uma tecnologia",
  cover: "Capa",
};

/** What a Project still needs before it can be published (RN-PROJECT-009). */
export function projectPublishReadiness(project: {
  shortDescription: string | null;
  fullDescription: string | null;
  technologies: string[];
  coverPath: string | null;
}): { ready: boolean; missing: ProjectPublishRequirement[] } {
  const missing: ProjectPublishRequirement[] = [];
  if (!project.shortDescription?.trim()) missing.push("shortDescription");
  if (!project.fullDescription?.trim()) missing.push("fullDescription");
  if (project.technologies.length === 0) missing.push("technologies");
  if (!project.coverPath?.trim()) missing.push("cover");
  return { ready: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Dates — operate on "YYYY-MM-DD" strings to avoid Date timezone traps.
// `today` is a Date only so the caller can pass the browser's real local day.
// ---------------------------------------------------------------------------

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, amount: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + amount));
}

/** ISO week: Monday .. Sunday. */
export function startOfWeek(today: Date): string {
  const iso = toISODate(today);
  const dow = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getDay();
  const backToMonday = (dow + 6) % 7;
  return addDays(iso, -backToMonday);
}

export function endOfWeek(today: Date): string {
  return addDays(startOfWeek(today), 6);
}

export function startOfMonth(today: Date): string {
  return `${toISODate(today).slice(0, 7)}-01`;
}

export function endOfMonth(today: Date): string {
  return addDays(toISODate(new Date(today.getFullYear(), today.getMonth() + 1, 1)), -1);
}

/**
 * A Task is overdue when it has a due date in the past and is not done.
 * Calculated, never persisted (RN-TASK-006/007). `dueDate` is a "YYYY-MM-DD"
 * string (Postgres `date`); `today` defaults to the current local date.
 */
export function isTaskOverdue(
  dueDate: string | null | undefined,
  status: TaskStatus,
  today: Date = new Date(),
): boolean {
  if (!dueDate || status === "done") return false;
  return dueDate < toISODate(today);
}

// ---------------------------------------------------------------------------
// Planejamento — temporal cuts + grouping over the same Task base.
// ---------------------------------------------------------------------------

export interface PlannableTask {
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export const PLANNING_CUTS = [
  "week",
  "month",
  "next7",
  "overdue",
  "undated",
  "unfinished",
  "custom",
] as const;
export type PlanningCut = (typeof PLANNING_CUTS)[number];

export const PLANNING_CUT_LABELS: Record<PlanningCut, string> = {
  week: "Esta semana",
  month: "Este mês",
  next7: "Próximos 7 dias",
  overdue: "Atrasadas",
  undated: "Sem prazo",
  unfinished: "Não concluídas",
  custom: "Período personalizado",
};

function inWindowOrUndated(task: PlannableTask, from: string, to: string): boolean {
  if (task.dueDate === null) return true;
  return task.dueDate >= from && task.dueDate <= to;
}

/**
 * Whether a task belongs to a Planejamento cut. Completed tasks never match —
 * Planejamento is a forward-looking "what should I focus on" view (DEC-028);
 * retrospective lives on the Dashboard / Estudos. Undated tasks stay visible in
 * the dated cuts (RF-WEEK-011) and surface in the "Sem prazo" group.
 */
export function taskMatchesCut(
  task: PlannableTask,
  cut: PlanningCut,
  today: Date = new Date(),
  customRange?: DateRange,
): boolean {
  if (cut === "overdue") return isTaskOverdue(task.dueDate, task.status, today);
  if (task.status === "done") return false;

  switch (cut) {
    case "undated":
      return task.dueDate === null;
    case "unfinished":
      return true;
    case "week":
      return inWindowOrUndated(task, startOfWeek(today), endOfWeek(today));
    case "month":
      return inWindowOrUndated(task, startOfMonth(today), endOfMonth(today));
    case "next7":
      return inWindowOrUndated(task, toISODate(today), addDays(toISODate(today), 7));
    case "custom":
      if (!customRange?.from || !customRange?.to) return false;
      return inWindowOrUndated(task, customRange.from, customRange.to);
    default:
      return false;
  }
}

export type TimeframeGroupKey = "overdue" | "today" | "tomorrow" | "upcoming" | "undated";

export interface TimeframeGroup<T> {
  key: TimeframeGroupKey;
  label: string;
  tasks: T[];
}

const TIMEFRAME_LABELS: Record<TimeframeGroupKey, string> = {
  overdue: "Atrasadas",
  today: "Hoje",
  tomorrow: "Amanhã",
  upcoming: "Próximos dias",
  undated: "Sem prazo",
};

const TIMEFRAME_ORDER: TimeframeGroupKey[] = [
  "overdue",
  "today",
  "tomorrow",
  "upcoming",
  "undated",
];

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Groups tasks into ordered timeframe buckets; empty buckets are dropped. */
export function groupTasksByTimeframe<T extends PlannableTask>(
  tasks: T[],
  today: Date = new Date(),
): TimeframeGroup<T>[] {
  const todayIso = toISODate(today);
  const tomorrowIso = addDays(todayIso, 1);

  const buckets: Record<TimeframeGroupKey, T[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    upcoming: [],
    undated: [],
  };

  for (const task of tasks) {
    if (task.dueDate === null) buckets.undated.push(task);
    else if (task.status !== "done" && task.dueDate < todayIso) buckets.overdue.push(task);
    else if (task.dueDate <= todayIso) buckets.today.push(task);
    else if (task.dueDate === tomorrowIso) buckets.tomorrow.push(task);
    else buckets.upcoming.push(task);
  }

  const compare = (a: T, b: T) => {
    const ad = a.dueDate ?? "9999-12-31";
    const bd = b.dueDate ?? "9999-12-31";
    if (ad !== bd) return ad < bd ? -1 : 1;
    if (PRIORITY_WEIGHT[a.priority] !== PRIORITY_WEIGHT[b.priority]) {
      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    }
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  };

  return TIMEFRAME_ORDER.map((key) => ({
    key,
    label: TIMEFRAME_LABELS[key],
    tasks: [...buckets[key]].sort(compare),
  })).filter((group) => group.tasks.length > 0);
}

// ---------------------------------------------------------------------------
// Public Portfolio — the DTO shape returned by public.get_public_portfolio().
// Field names match the SQL json_build_object keys exactly (camelCase); the
// server layer only resolves cover URLs on top of this.
// ---------------------------------------------------------------------------

export interface PublicPortfolioProfile {
  name: string;
  headline: string | null;
  intro: string | null;
  about: string | null;
}

export interface PublicPortfolioStatus {
  company: string | null;
  role: string | null;
  focus: string | null;
  /** building_text, or the name of the published current project. */
  building: string | null;
}

export interface PublicPortfolioLink {
  type: string | null;
  label: string;
  href: string;
}

export interface PublicPortfolioStackItem {
  name: string;
  groupName: string | null;
  isFeatured: boolean;
}

export interface PublicPortfolioProject {
  id: string;
  name: string;
  shortDescription: string | null;
  fullDescription: string | null;
  technologies: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  projectDate: string | null;
  executionStatus: ProjectExecutionStatus;
  coverPath: string | null;
}

export interface PublicPortfolio {
  profile: PublicPortfolioProfile | null;
  status: PublicPortfolioStatus | null;
  links: PublicPortfolioLink[];
  stack: PublicPortfolioStackItem[];
  projects: PublicPortfolioProject[];
}
