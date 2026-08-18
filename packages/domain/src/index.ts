export const TASK_STATUSES = ["backlog", "in_progress", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const TOPIC_STATUSES = ["not_started", "studying", "completed"] as const;
export const PROJECT_EXECUTION_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "archived",
] as const;
export const PROJECT_PUBLICATION_STATUSES = ["draft", "published"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TopicStatus = (typeof TOPIC_STATUSES)[number];
