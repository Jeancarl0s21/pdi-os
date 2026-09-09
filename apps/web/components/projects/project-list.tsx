import type { Project } from "@/lib/projects/types";
import { ProjectCard } from "./project-card";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}
