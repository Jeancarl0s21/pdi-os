import { PageHeader } from "@/components/shell/page-header";
import { TasksView } from "@/components/tasks/tasks-view";
import { listActiveTasks, listTags } from "@/lib/tasks/queries";

export default async function TarefasPage() {
  const [tasks, tags] = await Promise.all([listActiveTasks(), listTags()]);

  return (
    <>
      <PageHeader title="Tasks" description="O que existe e em qual estado." />
      <TasksView tasks={tasks} tagSuggestions={tags} />
    </>
  );
}
