"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/tasks/types";
import { QuickTaskInput } from "./quick-task-input";
import { TaskDrawer } from "./task-drawer";
import { TaskList } from "./task-list";

type DrawerState = Task | "new" | null;

export function TasksView({ tasks, tagSuggestions }: { tasks: Task[]; tagSuggestions: string[] }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const editingTask = drawer && drawer !== "new" ? drawer : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <QuickTaskInput />
        </div>
        <Button variant="secondary" onClick={() => setDrawer("new")}>
          <Plus aria-hidden />
          Nova Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Nenhuma Task ainda"
          description="Crie a primeira pela entrada rápida acima ou pelo formulário completo."
          action={
            <Button onClick={() => setDrawer("new")}>
              <Plus aria-hidden />
              Criar Task
            </Button>
          }
        />
      ) : (
        <TaskList
          tasks={tasks}
          onOpen={(id) => setDrawer(tasks.find((task) => task.id === id) ?? null)}
        />
      )}

      <TaskDrawer
        open={drawer !== null}
        task={editingTask}
        tagSuggestions={tagSuggestions}
        onClose={() => setDrawer(null)}
        onSuccess={() => {
          setDrawer(null);
          router.refresh();
        }}
      />
    </div>
  );
}
