"use client";

import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ContentDidacticBody } from "@pdi-os/domain";
import type { RoadmapContent } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

function DidacticBody({ body }: { body: ContentDidacticBody }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm">
      {body.explanation ? <p className="text-foreground/90">{body.explanation}</p> : null}

      {body.keyPoints.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
          {body.keyPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      ) : null}

      {body.example ? (
        <div className="flex flex-col gap-1 rounded-md bg-secondary/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Exemplo{body.example.type ? ` · ${body.example.type}` : ""}
          </p>
          {body.example.context ? (
            <p className="text-xs text-muted-foreground">{body.example.context}</p>
          ) : null}
          {body.example.content ? (
            <p className="whitespace-pre-wrap text-foreground/90">{body.example.content}</p>
          ) : null}
          {body.example.resultExplanation ? (
            <p className="text-xs text-muted-foreground">{body.example.resultExplanation}</p>
          ) : null}
        </div>
      ) : null}

      {body.whenToUse ? (
        <p>
          <span className="font-medium text-foreground">Quando usar: </span>
          <span className="text-muted-foreground">{body.whenToUse}</span>
        </p>
      ) : null}
      {body.pitfalls ? (
        <p>
          <span className="font-medium text-foreground">Cuidados: </span>
          <span className="text-muted-foreground">{body.pitfalls}</span>
        </p>
      ) : null}
    </div>
  );
}

function ContentItem({ content }: { content: RoadmapContent }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const done = content.completedAt !== null;

  return (
    <li className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border",
            done
              ? "border-[color:var(--pdi-success)] bg-[color:var(--pdi-success)]/20"
              : "border-border",
          )}
        >
          {done ? <Check className="size-3 text-[color:var(--pdi-success)]" /> : null}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {content.title}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <div id={panelId} hidden={!open}>
        <DidacticBody body={content.body} />
      </div>
    </li>
  );
}

export function ContentList({ contents }: { contents: RoadmapContent[] }) {
  if (contents.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Conteúdo
      </h2>
      <ul className="flex flex-col gap-2">
        {contents.map((content) => (
          <ContentItem key={content.id} content={content} />
        ))}
      </ul>
    </section>
  );
}
