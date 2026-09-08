import { ListTodo } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export default function TarefasPage() {
  return (
    <>
      <PageHeader title="Tasks" description="O que existe e em qual estado." />
      <EmptyState
        icon={<ListTodo aria-hidden />}
        title="Tasks em construção"
        description="Kanban, filtros, Quick Task e o drawer de Task chegam no Slice 1."
      />
    </>
  );
}
