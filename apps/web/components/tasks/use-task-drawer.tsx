"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/tasks/types";
import { TaskDrawer } from "./task-drawer";

type DrawerState = Task | "new" | null;

/**
 * Shared Task create/edit drawer plumbing for the Tasks and Planejamento views.
 * `drawerNode` is the fully wired `<TaskDrawer>` — render it once per view.
 */
export function useTaskDrawer(
  tasks: Task[],
  tagSuggestions: string[],
): { openNew: () => void; openTask: (id: string) => void; drawerNode: ReactNode } {
  const router = useRouter();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const editingTask = drawer && drawer !== "new" ? drawer : undefined;

  const openNew = useCallback(() => setDrawer("new"), []);
  const openTask = useCallback(
    (id: string) => setDrawer(tasks.find((task) => task.id === id) ?? null),
    [tasks],
  );

  const drawerNode = (
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
  );

  return { openNew, openTask, drawerNode };
}
