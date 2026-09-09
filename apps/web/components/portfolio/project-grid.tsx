"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PROJECT_EXECUTION_STATUS_LABELS } from "@pdi-os/domain";
import type { PublicPortfolioProjectView } from "@/lib/portfolio/queries";
import { PublicProjectModal } from "./public-project-modal";

/** Project cards; a card opens the detail modal (never a dedicated page — UX-DEC-001). */
export function ProjectGrid({ projects }: { projects: PublicPortfolioProjectView[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedId = searchParams.get("projeto");
  const selected = projects.find((project) => project.id === selectedId) ?? null;

  const open = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("projeto", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("projeto");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (projects.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 border-t border-border py-12">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Projects
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => open(project.id)}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-background text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {project.coverUrl ? (
              <img
                src={project.coverUrl}
                alt=""
                className="aspect-video w-full border-b border-border object-cover"
              />
            ) : null}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{project.name}</h3>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {PROJECT_EXECUTION_STATUS_LABELS[project.executionStatus]}
                </span>
              </div>
              {project.shortDescription ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {project.shortDescription}
                </p>
              ) : null}
              {project.technologies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <PublicProjectModal project={selected} coverUrl={selected.coverUrl} onClose={close} />
      ) : null}
    </section>
  );
}
