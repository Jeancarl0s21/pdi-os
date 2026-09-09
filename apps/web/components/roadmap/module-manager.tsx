"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ChevronDown, ChevronRight, ChevronUp, Pencil, Plus } from "lucide-react";
import { archiveModule, moveModule } from "@/lib/roadmap/edit-actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { RoadmapModuleSummary } from "@/lib/roadmap/types";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./progress-bar";
import { ModuleEditor } from "./module-editor";

export function ModuleManager({
  trackId,
  modules,
}: {
  trackId: string;
  modules: RoadmapModuleSummary[];
}) {
  const [managing, setManaging] = useState(false);
  const [editing, setEditing] = useState<RoadmapModuleSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [move, moving] = useServerMutation(moveModule);
  const [archive, archiving] = useServerMutation(archiveModule);
  const busy = moving || archiving;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Modules
        </h2>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setManaging((v) => !v)}>
            {managing ? "Concluir" : "Gerenciar"}
          </Button>
          {managing ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Novo Module
            </Button>
          ) : null}
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {modules.map((module, index) => (
          <li
            key={module.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Link
                href={`/app/roadmap/${module.id}`}
                className="truncate font-medium text-foreground hover:underline"
              >
                {module.title}
              </Link>
              {module.description ? (
                <p className="line-clamp-1 text-sm text-muted-foreground">{module.description}</p>
              ) : null}
              <ProgressBar progress={module.progress} />
            </div>

            {managing ? (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Mover ${module.title} para cima`}
                  disabled={busy || index === 0}
                  onClick={() => move({ id: module.id, position: String(index - 1) })}
                >
                  <ChevronUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Mover ${module.title} para baixo`}
                  disabled={busy || index === modules.length - 1}
                  onClick={() => move({ id: module.id, position: String(index + 1) })}
                >
                  <ChevronDown aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Editar ${module.title}`}
                  onClick={() => setEditing(module)}
                >
                  <Pencil aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Arquivar ${module.title}`}
                  disabled={busy}
                  onClick={() => archive({ id: module.id })}
                >
                  <Archive aria-hidden />
                </Button>
              </div>
            ) : (
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            )}
          </li>
        ))}
      </ul>

      {creating ? <ModuleEditor onClose={() => setCreating(false)} trackId={trackId} /> : null}
      {editing ? (
        <ModuleEditor onClose={() => setEditing(null)} trackId={trackId} module={editing} />
      ) : null}
    </div>
  );
}
