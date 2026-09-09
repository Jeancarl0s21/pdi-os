import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { ArchivedList } from "@/components/tasks/archived-list";
import { buttonVariants } from "@/components/ui/button";
import { listArchivedTasks } from "@/lib/tasks/queries";

export default async function ArquivadasPage() {
  const tasks = await listArchivedTasks();

  return (
    <>
      <PageHeader
        title="Tasks arquivadas"
        description="Fora das visões normais, mas preservadas no histórico."
        actions={
          <Link href="/app/tarefas" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden />
            Tasks
          </Link>
        }
      />
      {tasks.length === 0 ? (
        <EmptyState
          title="Nada arquivado"
          description="Tasks que você arquivar no Kanban aparecem aqui."
        />
      ) : (
        <ArchivedList tasks={tasks} />
      )}
    </>
  );
}
