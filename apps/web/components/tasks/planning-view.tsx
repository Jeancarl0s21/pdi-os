"use client";

import { useMemo, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { groupTasksByTimeframe, taskMatchesCut, type PlanningCut } from "@pdi-os/domain";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import type { Task } from "@/lib/tasks/types";
import { CutSelector } from "./cut-selector";
import {
  EMPTY_FILTERS,
  TaskFilters,
  taskFiltersActive,
  type TaskFilterValues,
} from "./task-filters";
import { TaskGroupList } from "./task-group-list";
import { useTaskDrawer } from "./use-task-drawer";

export function PlanningView({
  tasks,
  tagSuggestions,
}: {
  tasks: Task[];
  tagSuggestions: string[];
}) {
  const { openNew, openTask, drawerNode } = useTaskDrawer(tasks, tagSuggestions);
  const [cut, setCut] = useLocalStorage<PlanningCut>("pdi.planning.cut", "week");
  const [range, setRange] = useLocalStorage("pdi.planning.range", { from: "", to: "" });
  const [filters, setFilters] = useState<TaskFilterValues>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  const groups = useMemo(() => {
    const matched = tasks.filter((task) => {
      if (!taskMatchesCut(task, cut, today, range)) return false;
      if (filters.category && task.category !== filters.category) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.tag && !task.tags.includes(filters.tag)) return false;
      return true;
    });
    return groupTasksByTimeframe(matched, today);
  }, [tasks, cut, range, filters, today]);

  const customIncomplete = cut === "custom" && (!range.from || !range.to);

  return (
    <div className="flex flex-col gap-5">
      <CutSelector value={cut} onChange={setCut} />

      {cut === "custom" ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            De
            <Input
              type="date"
              value={range.from}
              max={range.to || undefined}
              onChange={(event) => setRange({ ...range, from: event.target.value })}
              className="w-auto"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Até
            <Input
              type="date"
              value={range.to}
              min={range.from || undefined}
              onChange={(event) => setRange({ ...range, to: event.target.value })}
              className="w-auto"
            />
          </label>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="hidden flex-1 sm:block">
          <TaskFilters values={filters} onChange={setFilters} tagOptions={tagSuggestions} />
        </div>
        <Button variant="ghost" className="sm:hidden" onClick={() => setFilterSheetOpen(true)}>
          <SlidersHorizontal aria-hidden />
          Filtros{taskFiltersActive(filters) ? " •" : ""}
        </Button>
        <Button variant="secondary" onClick={openNew}>
          <Plus aria-hidden />
          Nova Task
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title={customIncomplete ? "Defina o período" : "Nada neste recorte"}
          description={
            customIncomplete
              ? "Escolha as datas de início e fim."
              : "Nenhuma Task se encaixa aqui agora."
          }
          action={
            <Button onClick={openNew}>
              <Plus aria-hidden />
              Criar Task
            </Button>
          }
        />
      ) : (
        <TaskGroupList groups={groups} onOpen={openTask} />
      )}

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
