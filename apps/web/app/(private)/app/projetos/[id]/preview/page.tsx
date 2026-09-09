import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { PreviewModal } from "@/components/projects/preview-modal";
import { getProject } from "@/lib/projects/queries";

export default async function ProjectPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title="Preview"
        description="Exatamente o modal que quem visita o Portfolio vê. Feche para voltar ao editor."
      />
      <div aria-hidden className="grid gap-5 opacity-40 sm:grid-cols-2">
        <div className="h-40 rounded-xl border border-border bg-card" />
        <div className="h-40 rounded-xl border border-border bg-card" />
      </div>
      <PreviewModal project={project} coverUrl={project.coverUrl} projectId={project.id} />
    </>
  );
}
