import { PageHeader } from "@/components/shell/page-header";
import { PlanningView } from "@/components/tasks/planning-view";
import { listActiveTasks, listTags } from "@/lib/tasks/queries";

export default async function PlanejamentoPage() {
  const [tasks, tags] = await Promise.all([listActiveTasks(), listTags()]);

  return (
    <>
      <PageHeader title="Planejamento" description="Em que devo focar neste período." />
      <PlanningView tasks={tasks} tagSuggestions={tags} />
    </>
  );
}
