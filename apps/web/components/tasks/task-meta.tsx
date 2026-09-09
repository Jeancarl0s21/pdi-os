"use client";

import { CalendarDays } from "lucide-react";
import { isTaskOverdue, TASK_CATEGORY_LABELS, TASK_STATUS_LABELS } from "@pdi-os/domain";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/tasks/types";

export function formatDueDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** Shared secondary line for a Task: status, category, due date, tags. */
export function TaskMeta({ task, showStatus = true }: { task: Task; showStatus?: boolean }) {
  const overdue = isTaskOverdue(task.dueDate, task.status);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {showStatus ? <Badge variant="neutral">{TASK_STATUS_LABELS[task.status]}</Badge> : null}
      {task.category ? (
        <Badge variant="neutral">{TASK_CATEGORY_LABELS[task.category]}</Badge>
      ) : null}
      {task.dueDate ? (
        <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
          <CalendarDays aria-hidden className="size-3.5" />
          {formatDueDate(task.dueDate)}
          {overdue ? " · atrasada" : ""}
        </span>
      ) : null}
      {task.tags.map((tag) => (
        <span key={tag} className="rounded-full bg-secondary px-2 py-0.5">
          {tag}
        </span>
      ))}
    </div>
  );
}
