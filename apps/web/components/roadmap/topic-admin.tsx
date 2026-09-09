"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Pencil } from "lucide-react";
import { archiveTopic } from "@/lib/roadmap/edit-actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { TopicEditor } from "./topic-editor";

export function TopicAdmin({
  moduleId,
  topic,
}: {
  moduleId: string;
  topic: {
    id: string;
    title: string;
    description: string | null;
    notes: string | null;
    recommendedLevel: string | null;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archive, archiving, archiveResult] = useServerMutation(archiveTopic);

  useEffect(() => {
    if (archiveResult?.ok) router.push(`/app/roadmap/${moduleId}`);
  }, [archiveResult, router, moduleId]);

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
        <Pencil aria-hidden />
        Editar
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmArchive(true)}>
        <Archive aria-hidden />
        Arquivar
      </Button>

      {editing ? (
        <TopicEditor onClose={() => setEditing(false)} moduleId={moduleId} topic={topic} />
      ) : null}

      <Drawer
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Arquivar Topic"
        description="Sai da experiência principal do Roadmap, mas continua consultável em arquivados."
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setConfirmArchive(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={archiving}
            onClick={() => archive({ id: topic.id })}
          >
            {archiving ? "Arquivando…" : "Arquivar"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
