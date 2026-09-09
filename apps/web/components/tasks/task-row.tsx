"use client";

import { CalendarDays } from "lucide-react";
import {
  isTaskOverdue,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@pdi-os/domain";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/tasks/types";

function formatDueDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function TaskRow({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const overdue = isTaskOverdue(task.dueDate, task.status);

  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "font-medium text-foreground",
            task.status === "done" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>
        <Badge
          variant={
            task.priority === "high" ? "danger" : task.priority === "low" ? "neutral" : "accent"
          }
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="neutral">{TASK_STATUS_LABELS[task.status]}</Badge>
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
    </button>
  );
}
