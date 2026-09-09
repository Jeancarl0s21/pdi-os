import { ExternalLink } from "lucide-react";
import { PROJECT_EXECUTION_STATUS_LABELS, type ProjectExecutionStatus } from "@pdi-os/domain";
import { GithubMark } from "@/components/icons/github-mark";
import { Badge } from "@/components/ui/badge";

/** The subset a Project needs to be rendered publicly — a private `Project` or the public DTO both satisfy it. */
export interface ShowcaseProject {
  name: string;
  executionStatus: ProjectExecutionStatus;
  shortDescription: string | null;
  fullDescription: string | null;
  technologies: string[];
  githubUrl: string | null;
  demoUrl: string | null;
}

/**
 * The visitor-facing rendering of a Project. Used by the private Preview page and
 * inside the public Portfolio's Project modal — so Preview reflects the real
 * thing by construction.
 */
export function ProjectShowcase({
  project,
  coverUrl,
}: {
  project: ShowcaseProject;
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
              <GithubMark aria-hidden className="size-4" />
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
