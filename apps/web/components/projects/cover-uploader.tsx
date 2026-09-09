"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { removeProjectCover, uploadProjectCover } from "@/lib/projects/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";

export function CoverUploader({
  projectId,
  coverUrl,
}: {
  projectId: string;
  coverUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [upload, uploading] = useServerMutation(uploadProjectCover);
  const [remove, removing] = useServerMutation(removeProjectCover);
  const busy = uploading || removing;

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Imagem maior que 5 MB.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("id", projectId);
    formData.set("file", file);
    upload(formData);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Capa</span>

      {coverUrl ? (
        <img
          src={coverUrl}
          alt="Capa do Project"
          className="aspect-video w-full max-w-sm rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full max-w-sm items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          Sem capa
        </div>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT} onChange={onFile} className="hidden" />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden />
          {coverUrl ? "Trocar capa" : "Enviar capa"}
        </Button>
        {coverUrl ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => remove({ id: projectId })}
          >
            <Trash2 aria-hidden />
            Remover
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">PNG, JPG ou WebP, até 5 MB.</p>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
