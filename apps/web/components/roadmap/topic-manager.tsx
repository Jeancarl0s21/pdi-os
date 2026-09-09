"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ChevronDown, ChevronRight, ChevronUp, Plus } from "lucide-react";
import { archiveTopic, moveTopic } from "@/lib/roadmap/edit-actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { RoadmapTopicSummary } from "@/lib/roadmap/types";
import { Button } from "@/components/ui/button";
import { TopicStatusBadge } from "./status-badge";
import { TopicEditor } from "./topic-editor";

export function TopicManager({
  moduleId,
  topics,
}: {
  moduleId: string;
  topics: RoadmapTopicSummary[];
}) {
  const [managing, setManaging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [move, moving] = useServerMutation(moveTopic);
  const [archive, archiving] = useServerMutation(archiveTopic);
  const busy = moving || archiving;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Topics
        </h2>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setManaging((v) => !v)}>
            {managing ? "Concluir" : "Gerenciar"}
          </Button>
          {managing ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Novo Topic
            </Button>
          ) : null}
        </div>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum Topic ativo neste Module.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topics.map((topic, index) => (
            <li
              key={topic.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <Link
                href={`/app/roadmap/${moduleId}/${topic.id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:underline"
              >
                {topic.title}
              </Link>
              <TopicStatusBadge status={topic.status} />

              {managing ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Mover ${topic.title} para cima`}
                    disabled={busy || index === 0}
                    onClick={() => move({ id: topic.id, position: String(index - 1) })}
                  >
                    <ChevronUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Mover ${topic.title} para baixo`}
                    disabled={busy || index === topics.length - 1}
                    onClick={() => move({ id: topic.id, position: String(index + 1) })}
                  >
                    <ChevronDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Arquivar ${topic.title}`}
                    disabled={busy}
                    onClick={() => archive({ id: topic.id })}
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
      )}

      {creating ? <TopicEditor onClose={() => setCreating(false)} moduleId={moduleId} /> : null}
    </div>
  );
}
