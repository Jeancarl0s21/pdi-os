"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createQuickTask, type TaskActionResult } from "@/lib/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL: TaskActionResult = { ok: false };

export function QuickTaskInput() {
  const [state, formAction, pending] = useActionState(createQuickTask, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const error = state.fieldErrors?.title ?? state.message;

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <label htmlFor="quick-task" className="sr-only">
          Nova Task rápida
        </label>
        <Input
          id="quick-task"
          name="title"
          placeholder="Nova Task — só o título e Enter"
          required
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "quick-task-error" : undefined}
        />
        {error ? (
          <p id="quick-task-error" role="alert" className="mt-1 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        <Plus aria-hidden />
        {pending ? "Adicionando…" : "Adicionar"}
      </Button>
    </form>
  );
}
