"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveModule, type RoadmapEditResult } from "@/lib/roadmap/edit-actions";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: RoadmapEditResult = { ok: false };

/** Mount only while open — a fresh useActionState per open cycle. */
export function ModuleEditor({
  onClose,
  trackId,
  module,
}: {
  onClose: () => void;
  trackId: string;
  module?: { id: string; title: string; description: string | null };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveModule, INITIAL);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  return (
    <Drawer
      open
      onClose={onClose}
      title={module ? "Editar Module" : "Novo Module"}
      description="A estrutura do Roadmap é uma ação secundária."
    >
      <form action={formAction} className="flex flex-col gap-4">
        {module ? (
          <input type="hidden" name="id" value={module.id} />
        ) : (
          <input type="hidden" name="trackId" value={trackId} />
        )}
        <Field label="Título" error={state.fieldErrors?.title}>
          {(field) => (
            <Input
              {...field}
              name="title"
              defaultValue={module?.title ?? ""}
              required
              autoFocus
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Descrição" error={state.fieldErrors?.description}>
          {(field) => (
            <Textarea
              {...field}
              name="description"
              rows={3}
              defaultValue={module?.description ?? ""}
            />
          )}
        </Field>
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
