import type { TaskCategory, TaskPriority, TaskStatus } from "@pdi-os/domain";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  position: number;
  createdAt: string;
  tags: string[];
}

export interface TaskCounts {
  pending: number;
  overdue: number;
  done: number;
}
