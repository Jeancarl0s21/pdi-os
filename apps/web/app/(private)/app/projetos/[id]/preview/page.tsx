import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectShowcase } from "@/components/projects/project-showcase";
import { buttonVariants } from "@/components/ui/button";
import { getProject } from "@/lib/projects/queries";

export default async function ProjectPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title="Preview"
        description="Como o Project aparece para quem visita o Portfolio."
        actions={
          <Link
            href={`/app/projetos/${project.id}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            <ArrowLeft aria-hidden />
            Editor
          </Link>
        }
      />
      <ProjectShowcase project={project} coverUrl={project.coverUrl} />
    </>
  );
}
