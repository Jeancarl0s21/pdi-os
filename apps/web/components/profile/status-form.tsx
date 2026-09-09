"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateStatus, type ProfileActionResult } from "@/lib/profile/actions";
import type { ProfileStatus } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const INITIAL: ProfileActionResult = { ok: false };

export function StatusForm({
  status,
  publishedProjects,
}: {
  status: ProfileStatus | null;
  publishedProjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateStatus, INITIAL);
  // The DB CHECK forbids setting both a free-text "building" and a linked project.
  const [source, setSource] = useState<"text" | "project">(
    status?.currentProjectId ? "project" : "text",
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Empresa" error={state.fieldErrors?.company}>
          {(field) => <Input {...field} name="company" defaultValue={status?.company ?? ""} />}
        </Field>
        <Field label="Cargo" error={state.fieldErrors?.role}>
          {(field) => <Input {...field} name="role" defaultValue={status?.role ?? ""} />}
        </Field>
      </div>
      <Field label="Foco atual" error={state.fieldErrors?.focus}>
        {(field) => <Input {...field} name="focus" defaultValue={status?.focus ?? ""} />}
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">Construindo</legend>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="radio"
            name="buildingSource"
            checked={source === "text"}
            onChange={() => setSource("text")}
          />
          Texto livre
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="radio"
            name="buildingSource"
            checked={source === "project"}
            onChange={() => setSource("project")}
          />
          Um Project publicado
        </label>
      </fieldset>

      {source === "text" ? (
        <Field label="O que está construindo" error={state.fieldErrors?.buildingText}>
          {(field) => (
            <Input {...field} name="buildingText" defaultValue={status?.buildingText ?? ""} />
          )}
        </Field>
      ) : (
        <input type="hidden" name="buildingText" value="" />
      )}

      {source === "project" ? (
        <Field label="Project" error={state.fieldErrors?.currentProjectId}>
          {(field) => (
            <Select
              {...field}
              name="currentProjectId"
              defaultValue={status?.currentProjectId ?? ""}
            >
              <option value="">Nenhum</option>
              {publishedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : (
        <input type="hidden" name="currentProjectId" value="" />
      )}

      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-[color:var(--pdi-success)]">
          Status salvo.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar status"}
        </Button>
      </div>
    </form>
  );
}
