"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { removeStackItem, saveStackItem } from "@/lib/profile/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { StackItem } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function StackItemForm({ item, onDone }: { item?: StackItem; onDone: () => void }) {
  const [save, saving, result] = useServerMutation(saveStackItem);

  useEffect(() => {
    if (result?.ok) onDone();
  }, [result, onDone]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-3">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" error={result?.fieldErrors?.name}>
          {(field) => (
            <Input
              {...field}
              name="name"
              defaultValue={item?.name ?? ""}
              required
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Grupo" hint="ex.: Dados, Backend" error={result?.fieldErrors?.groupName}>
          {(field) => (
            <Input
              {...field}
              name="groupName"
              defaultValue={item?.groupName ?? ""}
              autoComplete="off"
            />
          )}
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isFeatured" defaultChecked={item?.isFeatured ?? false} />
        Destacar na landing
      </label>
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

export function StackEditor({ items }: { items: StackItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [remove, removing] = useServerMutation(removeStackItem);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <StackItemForm item={item} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">
                  {item.name}
                  {item.isFeatured ? (
                    <span className="ml-2 text-xs text-primary">destaque</span>
                  ) : null}
                </p>
                {item.groupName ? (
                  <p className="truncate text-xs text-muted-foreground">{item.groupName}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Editar ${item.name}`}
                  onClick={() => setEditingId(item.id)}
                >
                  <Pencil aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Remover ${item.name}`}
                  disabled={removing}
                  onClick={() => remove({ id: item.id })}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <StackItemForm onDone={() => setAdding(false)} />
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus aria-hidden />
          Adicionar item
        </Button>
      )}
    </div>
  );
}
