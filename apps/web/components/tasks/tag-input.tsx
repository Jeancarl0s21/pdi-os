"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({
  name,
  defaultValue = [],
  suggestions = [],
  ariaInvalid,
  ariaDescribedBy,
  id,
}: {
  name: string;
  defaultValue?: string[];
  suggestions?: string[];
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  id?: string;
}) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const listId = useId();

  function addTag(raw: string) {
    const value = raw.trim().replace(/,$/, "").trim();
    if (!value) return;
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setTags([...tags, value]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1.5",
        "focus-within:ring-2 focus-within:ring-ring aria-[invalid=true]:border-destructive",
      )}
      aria-invalid={ariaInvalid}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
        >
          <input type="hidden" name={name} value={tag} />
          {tag}
          <button
            type="button"
            aria-label={`Remover tag ${tag}`}
            onClick={() => setTags(tags.filter((t) => t !== tag))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(draft)}
        list={listId}
        placeholder={tags.length === 0 ? "Adicionar tag e Enter" : ""}
        aria-describedby={ariaDescribedBy}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
      />
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </div>
  );
}
