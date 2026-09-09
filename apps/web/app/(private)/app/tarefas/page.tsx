import Link from "next/link";
import { Archive } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { buttonVariants } from "@/components/ui/button";
import { listActiveTasks, listTags } from "@/lib/tasks/queries";

export default async function TarefasPage() {
  const [tasks, tags] = await Promise.all([listActiveTasks(), listTags()]);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="O que existe e em qual estado."
        actions={
          <Link href="/app/tarefas/arquivadas" className={buttonVariants({ variant: "ghost" })}>
            <Archive aria-hidden />
            Arquivadas
          </Link>
        }
      />
      <KanbanBoard tasks={tasks} tagSuggestions={tags} />
    </>
  );
}
