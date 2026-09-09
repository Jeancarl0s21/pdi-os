import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RoadmapModuleSummary } from "@/lib/roadmap/types";
import { ProgressBar } from "./progress-bar";

export function ModuleList({ modules }: { modules: RoadmapModuleSummary[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {modules.map((module) => (
        <li key={module.id}>
          <Link
            href={`/app/roadmap/${module.id}`}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-medium text-foreground">{module.title}</h2>
                {module.editorialPriority ? (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {module.editorialPriority}
                  </span>
                ) : null}
              </div>
              {module.description ? (
                <p className="line-clamp-1 text-sm text-muted-foreground">{module.description}</p>
              ) : null}
              <ProgressBar progress={module.progress} />
            </div>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
