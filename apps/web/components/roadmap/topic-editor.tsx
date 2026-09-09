"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveTopic, type RoadmapEditResult } from "@/lib/roadmap/edit-actions";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: RoadmapEditResult = { ok: false };

export function TopicEditor({
  open,
  onClose,
  moduleId,
  topic,
}: {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  topic?: {
    id: string;
    title: string;
    description: string | null;
    notes: string | null;
    recommendedLevel: string | null;
  };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveTopic, INITIAL);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  return (
    <Drawer open={open} onClose={onClose} title={topic ? "Editar Topic" : "Novo Topic"}>
      <form action={formAction} className="flex flex-col gap-4">
        {topic ? (
          <input type="hidden" name="id" value={topic.id} />
        ) : (
          <input type="hidden" name="moduleId" value={moduleId} />
        )}
        <Field label="Título" error={state.fieldErrors?.title}>
          {(field) => (
            <Input
              {...field}
              name="title"
              defaultValue={topic?.title ?? ""}
              required
              autoFocus
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Nível recomendado" hint="ex.: Fundamentos, Júnior">
          {(field) => (
            <Input
              {...field}
              name="recommendedLevel"
              defaultValue={topic?.recommendedLevel ?? ""}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Descrição">
          {(field) => (
            <Textarea
              {...field}
              name="description"
              rows={4}
              defaultValue={topic?.description ?? ""}
            />
          )}
        </Field>
        {topic ? (
          <Field label="Notas">
            {(field) => (
              <Textarea {...field} name="notes" rows={3} defaultValue={topic.notes ?? ""} />
            )}
          </Field>
        ) : null}
        {state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
