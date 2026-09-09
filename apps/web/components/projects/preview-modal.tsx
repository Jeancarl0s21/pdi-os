"use client";

import { useRouter } from "next/navigation";
import { PublicProjectModal } from "@/components/portfolio/public-project-modal";
import type { ShowcaseProject } from "./project-showcase";

/**
 * Preview (WF-12 / UX-DEC-006): the private editor opens the *exact* modal the
 * public visitor sees, over a simulated landing backdrop. Closing returns to the
 * editor.
 */
export function PreviewModal({
  project,
  coverUrl,
  projectId,
}: {
  project: ShowcaseProject;
  coverUrl: string | null;
  projectId: string;
}) {
  const router = useRouter();
  return (
    <PublicProjectModal
      project={project}
      coverUrl={coverUrl}
      onClose={() => router.push(`/app/projetos/${projectId}`)}
    />
  );
}
