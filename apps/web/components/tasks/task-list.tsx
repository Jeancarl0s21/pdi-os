"use client";

import type { Task } from "@/lib/tasks/types";
import { TaskRow } from "./task-row";

export function TaskList({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskRow task={task} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
