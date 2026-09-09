"use client";

import { useActionState, useEffect } from "react";
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
} from "@pdi-os/domain";
import { createTask, updateTask, type TaskActionResult } from "@/lib/tasks/actions";
import type { Task } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "./tag-input";

const INITIAL: TaskActionResult = { ok: false };

export function TaskForm({
  task,
  tagSuggestions,
  onSuccess,
  onCancel,
}: {
  task?: Task;
  tagSuggestions: string[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(task);
  const [state, formAction, pending] = useActionState(isEdit ? updateTask : createTask, INITIAL);

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isEdit ? <input type="hidden" name="id" value={task!.id} /> : null}

      <Field label="Título" error={state.fieldErrors?.title}>
        {(field) => (
          <Input
            {...field}
            name="title"
            defaultValue={task?.title ?? ""}
            required
            autoFocus
            autoComplete="off"
          />
        )}
      </Field>

      <Field label="Descrição" error={state.fieldErrors?.description}>
        {(field) => (
          <Textarea {...field} name="description" defaultValue={task?.description ?? ""} />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prioridade" error={state.fieldErrors?.priority}>
          {(field) => (
            <Select {...field} name="priority" defaultValue={task?.priority ?? "medium"}>
              {TASK_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {TASK_PRIORITY_LABELS[value]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Status" error={state.fieldErrors?.status}>
          {(field) => (
            <Select {...field} name="status" defaultValue={task?.status ?? "backlog"}>
              {TASK_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {TASK_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Categoria" error={state.fieldErrors?.category}>
          {(field) => (
            <Select {...field} name="category" defaultValue={task?.category ?? ""}>
              <option value="">Sem categoria</option>
              {TASK_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {TASK_CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Prazo" error={state.fieldErrors?.dueDate}>
          {(field) => (
            <Input {...field} type="date" name="dueDate" defaultValue={task?.dueDate ?? ""} />
          )}
        </Field>
      </div>

      <Field label="Tags" hint="Enter ou vírgula para adicionar." error={state.fieldErrors?.tags}>
        {(field) => (
          <TagInput
            id={field.id}
            name="tags"
            defaultValue={task?.tags ?? []}
            suggestions={tagSuggestions}
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

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar Task"}
        </Button>
      </div>
    </form>
  );
}
