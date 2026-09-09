import Link from "next/link";
import { Plus } from "lucide-react";
import { PROJECT_EXECUTION_STATUSES, type ProjectExecutionStatus } from "@pdi-os/domain";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectStatusFilter } from "@/components/projects/project-status-filter";
import { buttonVariants } from "@/components/ui/button";
import { listProjects } from "@/lib/projects/queries";

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const valid = (PROJECT_EXECUTION_STATUSES as readonly string[]).includes(status ?? "")
    ? (status as ProjectExecutionStatus)
    : undefined;
  const projects = await listProjects({ status: valid });

  return (
    <>
      <PageHeader
        title="Projects"
        description="O que estou construindo e o que publico."
        actions={
          <Link href="/app/projetos/novo" className={buttonVariants()}>
            <Plus aria-hidden />
            Novo Project
          </Link>
        }
      />
      <ProjectStatusFilter active={valid ?? ""} />
      {projects.length === 0 ? (
        <EmptyState
          title={valid ? "Nenhum Project neste status" : "Nenhum Project ainda"}
          description="Crie o primeiro pelo botão “Novo Project”."
        />
      ) : (
        <ProjectList projects={projects} />
      )}
    </>
  );
}
