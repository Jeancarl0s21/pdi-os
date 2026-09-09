"use client";

import { RotateCcw } from "lucide-react";
import { restoreModule, restoreTopic } from "@/lib/roadmap/edit-actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { RoadmapArchived } from "@/lib/roadmap/types";
import { Button } from "@/components/ui/button";

function Row({
  label,
  sublabel,
  onRestore,
  pending,
}: {
  label: string;
  sublabel?: string;
  onRestore: () => void;
  pending: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{label}</p>
        {sublabel ? <p className="truncate text-xs text-muted-foreground">{sublabel}</p> : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label={`Restaurar ${label}`}
        disabled={pending}
        onClick={onRestore}
      >
        <RotateCcw aria-hidden />
        Restaurar
      </Button>
    </li>
  );
}

export function ArchivedRoadmap({ archived }: { archived: RoadmapArchived }) {
  const [restoreMod, restoringMod] = useServerMutation(restoreModule);
  const [restoreTop, restoringTop] = useServerMutation(restoreTopic);

  if (archived.modules.length === 0 && archived.topics.length === 0) {
    return <p className="text-sm text-muted-foreground">Nada arquivado.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {archived.modules.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Modules
          </h2>
          <ul className="flex flex-col gap-2">
            {archived.modules.map((module) => (
              <Row
                key={module.id}
                label={module.title}
                onRestore={() => restoreMod({ id: module.id })}
                pending={restoringMod}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {archived.topics.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Topics
          </h2>
          <ul className="flex flex-col gap-2">
            {archived.topics.map((topic) => (
              <Row
                key={topic.id}
                label={topic.title}
                sublabel={topic.moduleTitle}
                onRestore={() => restoreTop({ id: topic.id })}
                pending={restoringTop}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
