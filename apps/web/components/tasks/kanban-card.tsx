"use client";

import type { ReactNode } from "react";
import { Archive, ChevronLeft, ChevronRight } from "lucide-react";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskStatus,
} from "@pdi-os/domain";
import { archiveTask, moveTask } from "@/lib/tasks/actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/tasks/types";
import { TaskMeta } from "./task-meta";
import { useTaskMutation } from "./use-task-mutation";

const ORDER = TASK_STATUSES;

function CardButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground",
        "transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function KanbanCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const [move, moving] = useTaskMutation(moveTask);
  const [archive, archiving] = useTaskMutation(archiveTask);

  const index = ORDER.indexOf(task.status);
  const prev: TaskStatus | null = index > 0 ? ORDER[index - 1] : null;
  const next: TaskStatus | null = index < ORDER.length - 1 ? ORDER[index + 1] : null;
  const busy = moving || archiving;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="flex flex-col gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-sm font-medium text-foreground",
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
        <TaskMeta task={task} showStatus={false} />
      </button>

      <div className="flex items-center gap-1">
        <CardButton
          disabled={!prev || busy}
          aria-label={prev ? `Mover para ${TASK_STATUS_LABELS[prev]}` : "Sem coluna anterior"}
          onClick={() => prev && move({ id: task.id, status: prev })}
        >
          <ChevronLeft aria-hidden />
        </CardButton>
        <CardButton
          disabled={!next || busy}
          aria-label={next ? `Mover para ${TASK_STATUS_LABELS[next]}` : "Sem próxima coluna"}
          onClick={() => next && move({ id: task.id, status: next })}
        >
          <ChevronRight aria-hidden />
        </CardButton>
        <CardButton
          disabled={busy}
          aria-label="Arquivar"
          className="ml-auto"
          onClick={() => archive({ id: task.id })}
        >
          <Archive aria-hidden />
        </CardButton>
      </div>
    </div>
  );
}
