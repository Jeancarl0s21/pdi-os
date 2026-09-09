"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { addFileEvidence, addLinkEvidence, removeEvidence } from "@/lib/evidence/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { Evidence, EvidenceContext } from "@/lib/evidence/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT =
  "application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv,application/json,.ipynb";

function AddForm({
  context,
  contextId,
  onDone,
}: {
  context: EvidenceContext;
  contextId: string;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"link" | "file">("link");
  const [error, setError] = useState<string | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [addLink, addingLink, linkResult] = useServerMutation(addLinkEvidence);
  const [addFile, addingFile, fileResult] = useServerMutation(addFileEvidence);

  useEffect(() => {
    if (linkResult?.ok || fileResult?.ok) onDone();
  }, [linkResult, fileResult, onDone]);

  function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("context", context);
    form.set("contextId", contextId);
    addLink(form);
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Arquivo maior que 5 MB.");
      return;
    }
    setError(null);
    const form = new FormData();
    form.set("context", context);
    form.set("contextId", contextId);
    form.set("title", fileTitle);
    form.set("file", file);
    addFile(form);
  }

  const message =
    error ?? linkResult?.message ?? fileResult?.message ?? linkResult?.fieldErrors?.url;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "link"} onChange={() => setMode("link")} />
          Link
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "file"} onChange={() => setMode("file")} />
          Arquivo
        </label>
      </div>

      {mode === "link" ? (
        <form onSubmit={submitLink} className="flex flex-col gap-3">
          <Field label="Título">
            {(field) => <Input {...field} name="title" autoComplete="off" />}
          </Field>
          <Field label="URL" error={linkResult?.fieldErrors?.url}>
            {(field) => <Input {...field} name="url" required autoComplete="off" />}
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={addingLink}>
              {addingLink ? "Salvando…" : "Adicionar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onDone}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Título">
            {(field) => (
              <Input
                {...field}
                autoComplete="off"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
              />
            )}
          </Field>
          <input type="file" accept={ACCEPT} onChange={onFile} className="text-sm" />
          <p className="text-xs text-muted-foreground">
            PDF, imagem, txt, csv, json ou ipynb, até 5 MB.
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={addingFile}>
            Cancelar
          </Button>
        </div>
      )}

      {message ? (
        <p role="alert" className="text-xs text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function EvidenceList({
  context,
  contextId,
  items,
}: {
  context: EvidenceContext;
  contextId: string;
  items: Evidence[];
}) {
  const [adding, setAdding] = useState(false);
  const [remove, removing] = useServerMutation(removeEvidence);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Evidências
      </span>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => {
            const href = item.kind === "link" ? item.externalUrl : item.fileUrl;
            const text = item.title ?? item.fileName ?? item.externalUrl ?? "Evidência";
            return (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                {item.kind === "link" ? (
                  <ExternalLink aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="min-w-0 flex-1 truncate text-primary hover:underline"
                  >
                    {text}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-foreground">{text}</span>
                )}
                <button
                  type="button"
                  aria-label={`Remover ${text}`}
                  disabled={removing}
                  onClick={() => remove({ id: item.id })}
                  className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 aria-hidden className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {adding ? (
        <AddForm context={context} contextId={contextId} onDone={() => setAdding(false)} />
      ) : (
        <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(true)}>
          <Plus aria-hidden />
          Adicionar evidência
        </Button>
      )}
    </div>
  );
}
