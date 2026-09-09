import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectEditor } from "@/components/projects/project-editor";
import { buttonVariants } from "@/components/ui/button";
import { getProject } from "@/lib/projects/queries";

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        description="Editor do Project."
        actions={
          <Link href="/app/projetos" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden />
            Projects
          </Link>
        }
      />
      <ProjectEditor mode="edit" project={project} />
    </>
  );
}
