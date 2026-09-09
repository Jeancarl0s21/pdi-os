"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { deleteStudySession } from "@/lib/study/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { StudySession } from "@/lib/study/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function SessionList({
  sessions,
  onEdit,
}: {
  sessions: StudySession[];
  onEdit: (session: StudySession) => void;
}) {
  const [confirming, setConfirming] = useState<StudySession | null>(null);
  const [remove, removing] = useServerMutation(deleteStudySession);

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum estudo registrado neste recorte.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays aria-hidden className="size-3.5" />
                {formatDate(session.studiedOn)}
                {session.durationMinutes ? <span>· {session.durationMinutes} min</span> : null}
              </div>
              <p className="text-sm font-medium text-foreground">{session.title}</p>
              {session.note ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{session.note}</p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {session.topicTitle ? <Badge variant="accent">{session.topicTitle}</Badge> : null}
                {session.projectName ? (
                  <Badge variant="neutral">{session.projectName}</Badge>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Editar ${session.title}`}
                onClick={() => onEdit(session)}
              >
                <Pencil aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Excluir ${session.title}`}
                onClick={() => setConfirming(session)}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {confirming ? (
        <Drawer
          open
          onClose={() => setConfirming(null)}
          title="Excluir estudo"
          description="A exclusão é definitiva."
        >
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirming(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removing}
              onClick={() => {
                remove({ id: confirming.id });
                setConfirming(null);
              }}
            >
              {removing ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        </Drawer>
      ) : null}
    </>
  );
}
