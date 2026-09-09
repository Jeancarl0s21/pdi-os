import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { TopicList } from "@/components/roadmap/topic-list";
import { ProgressBar } from "@/components/roadmap/progress-bar";
import { buttonVariants } from "@/components/ui/button";
import { getRoadmapModule } from "@/lib/roadmap/queries";

export default async function RoadmapModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const module = await getRoadmapModule(moduleId);
  if (!module) notFound();

  return (
    <>
      <PageHeader
        title={module.title}
        description={module.description ?? undefined}
        actions={
          <Link href="/app/roadmap" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden />
            Roadmap
          </Link>
        }
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Progresso do Module</span>
        <ProgressBar progress={module.progress} />
      </div>
      {module.topics.length > 0 ? (
        <TopicList moduleId={module.id} topics={module.topics} />
      ) : (
        <EmptyState title="Nenhum Topic ativo neste Module" />
      )}
    </>
  );
}
