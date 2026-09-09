"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { removeLink, saveLink } from "@/lib/profile/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { ProfileLink } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function LinkForm({ link, onDone }: { link?: ProfileLink; onDone: () => void }) {
  const [save, saving, result] = useServerMutation(saveLink);

  useEffect(() => {
    if (result?.ok) onDone();
  }, [result, onDone]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-3">
      {link ? <input type="hidden" name="id" value={link.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rótulo" error={result?.fieldErrors?.label}>
          {(field) => (
            <Input
              {...field}
              name="label"
              defaultValue={link?.label ?? ""}
              required
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Tipo" hint="ex.: github, linkedin, email" error={result?.fieldErrors?.type}>
          {(field) => (
            <Input {...field} name="type" defaultValue={link?.type ?? ""} autoComplete="off" />
          )}
        </Field>
      </div>
      <Field label="URL" error={result?.fieldErrors?.href}>
        {(field) => (
          <Input
            {...field}
            name="href"
            defaultValue={link?.href ?? ""}
            required
            autoComplete="off"
          />
        )}
      </Field>
      {result?.message ? (
        <p role="alert" className="text-xs text-destructive">
          {result.message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function LinksEditor({ links }: { links: ProfileLink[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [remove, removing] = useServerMutation(removeLink);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {links.map((link) =>
          editingId === link.id ? (
            <li key={link.id}>
              <LinkForm link={link} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{link.label}</p>
                <p className="truncate text-xs text-muted-foreground">{link.href}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Editar ${link.label}`}
                  onClick={() => setEditingId(link.id)}
                >
                  <Pencil aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Remover ${link.label}`}
                  disabled={removing}
                  onClick={() => remove({ id: link.id })}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <LinkForm onDone={() => setAdding(false)} />
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus aria-hidden />
          Adicionar link
        </Button>
      )}
    </div>
  );
}
