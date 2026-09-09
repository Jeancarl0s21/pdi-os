"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_ACTIVE_EXECUTION_STATUSES, PROJECT_EXECUTION_STATUS_LABELS } from "@pdi-os/domain";
import {
  archiveProject,
  createProject,
  restoreProject,
  updateProject,
  type ProjectActionResult,
} from "@/lib/projects/actions";
import type { Project } from "@/lib/projects/types";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tasks/tag-input";
import { CoverUploader } from "./cover-uploader";
import { PublishPanel } from "./publish-panel";

const INITIAL: ProjectActionResult = { ok: false };

export function ProjectEditor({ mode, project }: { mode: "create" | "edit"; project?: Project }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [state, formAction, pending] = useActionState(
    isEdit ? updateProject : createProject,
    INITIAL,
  );
  const [archive, archiving] = useServerMutation(archiveProject);
  const [restore, restoring] = useServerMutation(restoreProject);
  const archived = project?.executionStatus === "archived";

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <form action={formAction} className="flex max-w-2xl flex-1 flex-col gap-4">
        {isEdit ? <input type="hidden" name="id" value={project!.id} /> : null}

        <Field label="Nome" error={state.fieldErrors?.name}>
          {(field) => (
            <Input
              {...field}
              name="name"
              defaultValue={project?.name ?? ""}
              required
              autoFocus
              autoComplete="off"
            />
          )}
        </Field>

        <Field
          label="Descrição curta"
          hint="Aparece no card e no Portfolio."
          error={state.fieldErrors?.shortDescription}
        >
          {(field) => (
            <Textarea
              {...field}
              name="shortDescription"
              rows={2}
              defaultValue={project?.shortDescription ?? ""}
            />
          )}
        </Field>

        <Field label="Descrição completa" error={state.fieldErrors?.fullDescription}>
          {(field) => (
            <Textarea
              {...field}
              name="fullDescription"
              rows={6}
              defaultValue={project?.fullDescription ?? ""}
            />
          )}
        </Field>

        {archived ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Status: <Badge variant="neutral">Arquivado</Badge>
            <input type="hidden" name="executionStatus" value="planned" />
          </div>
        ) : (
          <Field label="Status de execução" error={state.fieldErrors?.executionStatus}>
            {(field) => (
              <Select
                {...field}
                name="executionStatus"
                defaultValue={project?.executionStatus ?? "planned"}
              >
                {PROJECT_ACTIVE_EXECUTION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_EXECUTION_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="GitHub" error={state.fieldErrors?.githubUrl}>
            {(field) => (
              <Input
                {...field}
                name="githubUrl"
                type="url"
                inputMode="url"
                placeholder="https://github.com/..."
                defaultValue={project?.githubUrl ?? ""}
              />
            )}
          </Field>
          <Field label="Demo" error={state.fieldErrors?.demoUrl}>
            {(field) => (
              <Input
                {...field}
                name="demoUrl"
                type="url"
                inputMode="url"
                placeholder="https://..."
                defaultValue={project?.demoUrl ?? ""}
              />
            )}
          </Field>
          <Field label="Data" error={state.fieldErrors?.projectDate}>
            {(field) => (
              <Input
                {...field}
                name="projectDate"
                type="date"
                defaultValue={project?.projectDate ?? ""}
              />
            )}
          </Field>
        </div>

        <Field
          label="Tecnologias"
          hint="Enter ou vírgula para adicionar."
          error={state.fieldErrors?.technologies}
        >
          {(field) => (
            <TagInput
              id={field.id}
              name="technologies"
              defaultValue={project?.technologies ?? []}
              ariaInvalid={field["aria-invalid"]}
              ariaDescribedBy={field["aria-describedby"]}
            />
          )}
        </Field>

        {state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            {isEdit && !archived ? (
              <Button
                type="button"
                variant="ghost"
                disabled={archiving}
                onClick={() => archive({ id: project!.id })}
              >
                Arquivar
              </Button>
            ) : null}
            {isEdit && archived ? (
              <Button
                type="button"
                variant="secondary"
                disabled={restoring}
                onClick={() => restore({ id: project!.id })}
              >
                Restaurar
              </Button>
            ) : null}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar Project"}
          </Button>
        </div>
      </form>

      {isEdit && project ? (
        <aside className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <CoverUploader projectId={project.id} coverUrl={project.coverUrl} />
          <PublishPanel project={project} />
        </aside>
      ) : null}
    </div>
  );
}
