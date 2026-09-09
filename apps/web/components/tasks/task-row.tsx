"use client";

import { TASK_PRIORITY_LABELS } from "@pdi-os/domain";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/tasks/types";
import { TaskMeta } from "./task-meta";

export function TaskRow({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
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
      <TaskMeta task={task} />
    </button>
  );
}
