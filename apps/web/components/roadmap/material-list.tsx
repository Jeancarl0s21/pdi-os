import { ExternalLink } from "lucide-react";
import type { RoadmapMaterial } from "@/lib/roadmap/types";

export function MaterialList({ materials }: { materials: RoadmapMaterial[] }) {
  if (materials.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Referências
      </h2>
      <ul className="flex flex-col gap-2">
        {materials.map((material) => (
          <li key={material.id}>
            <a
              href={material.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm text-foreground">{material.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {material.type} · {material.source}
                </span>
              </div>
              <ExternalLink aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
