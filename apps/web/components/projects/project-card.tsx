import Link from "next/link";
import { PROJECT_EXECUTION_STATUS_LABELS, PROJECT_PUBLICATION_STATUS_LABELS } from "@pdi-os/domain";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/projects/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/app/projetos/${project.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-foreground">{project.name}</span>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge variant={project.publicationStatus === "published" ? "success" : "neutral"}>
            {PROJECT_PUBLICATION_STATUS_LABELS[project.publicationStatus]}
          </Badge>
          <Badge variant="neutral">
            {PROJECT_EXECUTION_STATUS_LABELS[project.executionStatus]}
          </Badge>
        </div>
      </div>

      {project.shortDescription ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.shortDescription}</p>
      ) : null}

      {project.technologies.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
