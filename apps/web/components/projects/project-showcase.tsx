import { ExternalLink, Github } from "lucide-react";
import { PROJECT_EXECUTION_STATUS_LABELS } from "@pdi-os/domain";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/projects/types";

/**
 * The visitor-facing rendering of a Project. Used by the private Preview page and
 * (PR-3) inside the public Portfolio's Project modal — so Preview reflects the
 * real thing by construction.
 */
export function ProjectShowcase({
  project,
  coverUrl,
}: {
  project: Project;
  coverUrl: string | null;
}) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className="aspect-video w-full rounded-xl border border-border object-cover"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h2>
        <Badge variant="neutral">{PROJECT_EXECUTION_STATUS_LABELS[project.executionStatus]}</Badge>
      </div>

      {project.shortDescription ? (
        <p className="text-muted-foreground">{project.shortDescription}</p>
      ) : null}

      {project.fullDescription ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">{project.fullDescription}</p>
      ) : null}

      {project.technologies.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      ) : null}

      {project.githubUrl || project.demoUrl ? (
        <div className="flex flex-wrap gap-4">
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Github aria-hidden className="size-4" />
              GitHub
            </a>
          ) : null}
          {project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink aria-hidden className="size-4" />
              Demo
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
