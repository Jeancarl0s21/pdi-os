"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, X } from "lucide-react";
import {
  PROJECT_PUBLISH_REQUIREMENTS,
  PROJECT_PUBLISH_REQUIREMENT_LABELS,
  projectPublishReadiness,
} from "@pdi-os/domain";
import { publishProject, unpublishProject, type ProjectActionResult } from "@/lib/projects/actions";
import type { Project } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

const INITIAL: ProjectActionResult = { ok: false };

export function PublishPanel({ project }: { project: Project }) {
  const router = useRouter();
  const [publishState, publish, publishing] = useActionState(publishProject, INITIAL);
  const [unpublishState, unpublish, unpublishing] = useActionState(unpublishProject, INITIAL);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const published = project.publicationStatus === "published";
  const { ready, missing } = projectPublishReadiness(project);
  const previewHref = `/app/projetos/${project.id}/preview`;

  useEffect(() => {
    if (publishState.ok || unpublishState.ok) router.refresh();
  }, [publishState, unpublishState, router]);
  useEffect(() => {
    if (unpublishState.ok) setConfirmOpen(false);
  }, [unpublishState]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Publicação</span>
        <Badge variant={published ? "success" : "neutral"}>
          {published ? "Publicado" : "Rascunho"}
        </Badge>
      </div>

      {!published ? (
        <ul className="flex flex-col gap-1 text-sm">
          {PROJECT_PUBLISH_REQUIREMENTS.map((req) => {
            const met = !missing.includes(req);
            return (
              <li
                key={req}
                className={cn(
                  "flex items-center gap-2",
                  met ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {met ? (
                  <Check aria-hidden className="size-4 text-[color:var(--pdi-success)]" />
                ) : (
                  <X aria-hidden className="size-4 text-muted-foreground" />
                )}
                {PROJECT_PUBLISH_REQUIREMENT_LABELS[req]}
              </li>
            );
          })}
        </ul>
      ) : null}

      <Link href={previewHref} className={buttonVariants({ variant: "ghost" })}>
        <Eye aria-hidden />
        Ver Preview
      </Link>

      {published ? (
        <Button type="button" variant="ghost" onClick={() => setConfirmOpen(true)}>
          Despublicar
        </Button>
      ) : (
        <form action={publish}>
          <input type="hidden" name="id" value={project.id} />
          <Button type="submit" className="w-full" disabled={!ready || publishing}>
            {publishing ? "Publicando…" : "Publicar"}
          </Button>
        </form>
      )}

      {publishState.message ? (
        <p role="alert" className="text-sm text-destructive">
          {publishState.message}
        </p>
      ) : null}
      {publishState.ok && publishState.warning ? (
        <p role="status" className="text-sm text-[color:var(--pdi-warning)]">
          {publishState.warning}
        </p>
      ) : null}

      <Drawer open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Despublicar Project">
        <p className="text-sm text-muted-foreground">
          Ele sai do Portfolio público, mas continua salvo e editável aqui.
        </p>
        <form action={unpublish} className="mt-4 flex justify-end gap-2">
          <input type="hidden" name="id" value={project.id} />
          <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="destructive" disabled={unpublishing}>
            {unpublishing ? "Despublicando…" : "Despublicar"}
          </Button>
        </form>
        {unpublishState.message ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {unpublishState.message}
          </p>
        ) : null}
      </Drawer>
    </div>
  );
}
