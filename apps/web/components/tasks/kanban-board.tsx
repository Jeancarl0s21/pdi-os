"use client";

import { useMemo, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@pdi-os/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import type { Task } from "@/lib/tasks/types";
import { KanbanColumn } from "./kanban-column";
import { QuickTaskInput } from "./quick-task-input";
import {
  EMPTY_FILTERS,
  TaskFilters,
  taskFiltersActive,
  type TaskFilterValues,
} from "./task-filters";
import { useTaskDrawer } from "./use-task-drawer";

export function KanbanBoard({
  tasks,
  tagSuggestions,
}: {
  tasks: Task[];
  tagSuggestions: string[];
}) {
  const { openNew, openTask, drawerNode } = useTaskDrawer(tasks, tagSuggestions);
  const [filters, setFilters] = useState<TaskFilterValues>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("backlog");

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { backlog: [], in_progress: [], done: [] };
    for (const task of tasks) {
      if (filters.category && task.category !== filters.category) continue;
      if (filters.priority && task.priority !== filters.priority) continue;
      if (filters.tag && !task.tags.includes(filters.tag)) continue;
      map[task.status].push(task);
    }
    for (const status of TASK_STATUSES) {
      map[status].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    return map;
  }, [tasks, filters]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <QuickTaskInput />
        </div>
        <Button variant="secondary" onClick={openNew}>
          <Plus aria-hidden />
          Nova Task
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="hidden flex-1 sm:block">
          <TaskFilters values={filters} onChange={setFilters} tagOptions={tagSuggestions} />
        </div>
        <Button variant="ghost" className="sm:hidden" onClick={() => setFilterSheetOpen(true)}>
          <SlidersHorizontal aria-hidden />
          Filtros{taskFiltersActive(filters) ? " •" : ""}
        </Button>
      </div>

      <div role="group" aria-label="Coluna" className="flex gap-2 sm:hidden">
        {TASK_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={status === mobileStatus}
            onClick={() => setMobileStatus(status)}
            className={cn(
              "flex-1 rounded-full border px-2 py-1.5 text-xs transition-colors",
              status === mobileStatus
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {TASK_STATUS_LABELS[status]} ({byStatus[status].length})
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className={cn(status === mobileStatus ? "block" : "hidden", "sm:block")}
          >
            <KanbanColumn status={status} tasks={byStatus[status]} onOpen={openTask} />
          </div>
        ))}
      </div>

      <Drawer open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} title="Filtros">
        <TaskFilters values={filters} onChange={setFilters} tagOptions={tagSuggestions} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
            Limpar
          </Button>
          <Button onClick={() => setFilterSheetOpen(false)}>Aplicar</Button>
        </div>
      </Drawer>

      {drawerNode}
    </div>
  );
}
