"use client";

import { Drawer } from "@/components/ui/drawer";
import type { Task } from "@/lib/tasks/types";
import { TaskForm } from "./task-form";

export function TaskDrawer({
  open,
  task,
  tagSuggestions,
  onClose,
  onSuccess,
}: {
  open: boolean;
  task?: Task;
  tagSuggestions: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} title={task ? "Editar Task" : "Nova Task"}>
      {open ? (
        <TaskForm
          key={task?.id ?? "new"}
          task={task}
          tagSuggestions={tagSuggestions}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      ) : null}
    </Drawer>
  );
}
