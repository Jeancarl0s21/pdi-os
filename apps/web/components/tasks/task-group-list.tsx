"use client";

import type { TimeframeGroup } from "@pdi-os/domain";
import type { Task } from "@/lib/tasks/types";
import { TaskList } from "./task-list";

export function TaskGroupList({
  groups,
  onOpen,
}: {
  groups: TimeframeGroup<Task>[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section
          key={group.key}
          className="flex flex-col gap-2"
          aria-labelledby={`group-${group.key}`}
        >
          <h2
            id={`group-${group.key}`}
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            {group.label}
            <span className="rounded-full bg-secondary px-1.5 text-xs font-normal text-muted-foreground">
              {group.tasks.length}
            </span>
          </h2>
          <TaskList tasks={group.tasks} onOpen={onOpen} />
        </section>
      ))}
    </div>
  );
}
