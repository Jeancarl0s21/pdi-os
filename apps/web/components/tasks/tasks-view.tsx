"use client";

import { Plus } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/tasks/types";
import { QuickTaskInput } from "./quick-task-input";
import { TaskList } from "./task-list";
import { useTaskDrawer } from "./use-task-drawer";

export function TasksView({ tasks, tagSuggestions }: { tasks: Task[]; tagSuggestions: string[] }) {
  const { openNew, openTask, drawerNode } = useTaskDrawer(tasks, tagSuggestions);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <QuickTaskInput />
        </div>
        <Button variant="secondary" onClick={openNew}>
          <Plus aria-hidden />
          Nova Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Nenhuma Task ainda"
          description="Crie a primeira pela entrada rápida acima ou pelo formulário completo."
          action={
            <Button onClick={openNew}>
              <Plus aria-hidden />
              Criar Task
            </Button>
          }
        />
      ) : (
        <TaskList tasks={tasks} onOpen={openTask} />
      )}

      {drawerNode}
    </div>
  );
}
