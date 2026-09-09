"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ProjectShowcase, type ShowcaseProject } from "@/components/projects/project-showcase";

/**
 * The visitor's Project detail (WF-02): a large centered modal on desktop with
 * the landing behind it, a full-screen sheet on mobile (UX-DEC-009). Body is
 * `<ProjectShowcase>` — the exact same component the private Preview renders.
 */
export function PublicProjectModal({
  project,
  coverUrl,
  onClose,
}: {
  project: ShowcaseProject;
  coverUrl: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={project.name}
        className="absolute inset-0 flex flex-col border border-border bg-card shadow-xl sm:inset-x-0 sm:top-1/2 sm:bottom-auto sm:mx-auto sm:max-h-[85vh] sm:max-w-2xl sm:-translate-y-1/2 sm:rounded-xl"
      >
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <ProjectShowcase project={project} coverUrl={coverUrl} />
        </div>
      </div>
    </div>
  );
}
