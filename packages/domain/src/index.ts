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

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

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
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dueDate < `${y}-${m}-${d}`;
}
