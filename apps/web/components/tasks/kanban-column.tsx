"use client";

import { TASK_STATUS_LABELS, type TaskStatus } from "@pdi-os/domain";
import type { Task } from "@/lib/tasks/types";
import { KanbanCard } from "./kanban-card";

export function KanbanColumn({
  status,
  tasks,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpen: (id: string) => void;
}) {
  return (
    <section
      aria-labelledby={`column-${status}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-background/40 p-3"
    >
      <h2
        id={`column-${status}`}
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        {TASK_STATUS_LABELS[status]}
        <span className="rounded-full bg-secondary px-1.5 text-xs font-normal text-muted-foreground">
          {tasks.length}
        </span>
      </h2>

      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          Nada aqui
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <KanbanCard task={task} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
