"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createStudySession,
  updateStudySession,
  type StudyActionResult,
} from "@/lib/study/actions";
import type { StudySession } from "@/lib/study/types";
import type { Evidence } from "@/lib/evidence/types";
import { EvidenceList } from "@/components/evidence/evidence-list";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: StudyActionResult = { ok: false };

export function SessionForm({
  onClose,
  session,
  evidence,
  defaultDate,
  defaultTopicId,
  topics,
  projects,
}: {
  onClose: () => void;
  session?: StudySession;
  evidence?: Evidence[];
  defaultDate: string;
  defaultTopicId?: string;
  topics: { id: string; title: string }[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    session ? updateStudySession : createStudySession,
    INITIAL,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  return (
    <Drawer open onClose={onClose} title={session ? "Editar estudo" : "Registrar estudo"}>
      <form action={formAction} className="flex flex-col gap-4">
        {session ? <input type="hidden" name="id" value={session.id} /> : null}

        <Field label="Data" error={state.fieldErrors?.studiedOn}>
          {(field) => (
            <Input
              {...field}
              type="date"
              name="studiedOn"
              defaultValue={session?.studiedOn ?? defaultDate}
              required
            />
          )}
        </Field>
        <Field label="Assunto" error={state.fieldErrors?.title}>
          {(field) => (
            <Input
              {...field}
              name="title"
              defaultValue={session?.title ?? ""}
              required
              autoFocus
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Duração (min)" error={state.fieldErrors?.durationMinutes}>
          {(field) => (
            <Input
              {...field}
              type="number"
              min={1}
              name="durationMinutes"
              defaultValue={session?.durationMinutes ?? ""}
            />
          )}
        </Field>
        <Field label="Topic">
          {(field) => (
            <Select
              {...field}
              name="topicId"
              defaultValue={session?.topicId ?? defaultTopicId ?? ""}
            >
              <option value="">Nenhum</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Project">
          {(field) => (
            <Select {...field} name="projectId" defaultValue={session?.projectId ?? ""}>
              <option value="">Nenhum</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Anotação">
          {(field) => (
            <Textarea {...field} name="note" rows={4} defaultValue={session?.note ?? ""} />
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

      {session ? (
        <div className="mt-6 border-t border-border pt-4">
          <EvidenceList context="study" contextId={session.id} items={evidence ?? []} />
        </div>
      ) : null}
    </Drawer>
  );
}
