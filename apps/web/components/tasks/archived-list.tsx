"use client";

import type { Task } from "@/lib/tasks/types";
import { ArchivedRow } from "./archived-row";

export function ArchivedList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <ArchivedRow task={task} />
        </li>
      ))}
    </ul>
  );
}
