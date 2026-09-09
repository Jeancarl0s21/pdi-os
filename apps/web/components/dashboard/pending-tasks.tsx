"use client";

import { Check } from "lucide-react";
import { TASK_PRIORITY_LABELS } from "@pdi-os/domain";
import { moveTask } from "@/lib/tasks/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { DashboardTask } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PendingTasks({ tasks }: { tasks: DashboardTask[] }) {
  const [complete, completing] = useServerMutation(moveTask);

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma Task pendente.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => {
        const due = formatDate(task.dueDate);
        return (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-foreground">{task.title}</span>
              <span
                className={cn(
                  "text-xs",
                  task.overdue ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {TASK_PRIORITY_LABELS[task.priority]}
                {due ? ` · ${due}` : ""}
                {task.overdue ? " · atrasada" : ""}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Concluir ${task.title}`}
              disabled={completing}
              onClick={() => complete({ id: task.id, status: "done" })}
            >
              <Check aria-hidden />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
