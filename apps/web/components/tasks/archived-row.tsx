"use client";

import { RotateCcw } from "lucide-react";
import { TASK_PRIORITY_LABELS } from "@pdi-os/domain";
import { restoreTask } from "@/lib/tasks/actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/tasks/types";
import { TaskMeta } from "./task-meta";
import { useTaskMutation } from "./use-task-mutation";

function formatArchivedAt(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ArchivedRow({ task }: { task: Task }) {
  const [restore, pending] = useTaskMutation(restoreTask);

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-col gap-2">
        <span
          className={cn(
            "font-medium text-foreground",
            task.status === "done" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>
        <TaskMeta task={task} />
        {task.archivedAt ? (
          <span className="text-xs text-muted-foreground">
            Arquivada em {formatArchivedAt(task.archivedAt)}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <Badge
          variant={
            task.priority === "high" ? "danger" : task.priority === "low" ? "neutral" : "accent"
          }
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
        <button
          type="button"
          disabled={pending}
          onClick={() => restore({ id: task.id })}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <RotateCcw aria-hidden className="size-4" />
          Restaurar
        </button>
      </div>
    </div>
  );
}
