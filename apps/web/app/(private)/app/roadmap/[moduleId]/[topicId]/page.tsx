import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ContentList } from "@/components/roadmap/content-list";
import { ActivityList } from "@/components/roadmap/activity-list";
import { MaterialList } from "@/components/roadmap/material-list";
import { TopicStatusBadge } from "@/components/roadmap/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getRoadmapTopic } from "@/lib/roadmap/queries";

export default async function RoadmapTopicPage({
  params,
}: {
  params: Promise<{ moduleId: string; topicId: string }>;
}) {
  const { moduleId, topicId } = await params;
  const topic = await getRoadmapTopic(topicId);
  if (!topic || topic.moduleId !== moduleId) notFound();

  return (
    <>
      <PageHeader
        title={topic.title}
        description={topic.recommendedLevel ?? undefined}
        actions={
          <Link
            href={`/app/roadmap/${topic.moduleId}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            <ArrowLeft aria-hidden />
            {topic.moduleTitle}
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <TopicStatusBadge status={topic.status} />
      </div>

      {topic.description ? (
        <p className="whitespace-pre-wrap text-sm text-foreground/90">{topic.description}</p>
      ) : null}
      {topic.notes ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wide">Notas</p>
          <p className="whitespace-pre-wrap">{topic.notes}</p>
        </div>
      ) : null}

      <ContentList contents={topic.contents} />
      <ActivityList activities={topic.activities} />
      <MaterialList materials={topic.materials} />
    </>
  );
}
