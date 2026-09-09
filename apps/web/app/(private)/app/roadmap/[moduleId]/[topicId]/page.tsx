import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ContentList } from "@/components/roadmap/content-list";
import { ActivityList } from "@/components/roadmap/activity-list";
import { MaterialList } from "@/components/roadmap/material-list";
import { TopicActions } from "@/components/roadmap/topic-actions";
import { TopicAdmin } from "@/components/roadmap/topic-admin";
import { PublicExposureToggle } from "@/components/roadmap/public-exposure-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <TopicActions
          topicId={topic.id}
          status={topic.status}
          hasCompletedActivity={topic.activities.some((activity) => activity.completedAt !== null)}
        />
        <TopicAdmin
          moduleId={topic.moduleId}
          topic={{
            id: topic.id,
            title: topic.title,
            description: topic.description,
            notes: topic.notes,
            recommendedLevel: topic.recommendedLevel,
          }}
        />
      </div>

      <PublicExposureToggle
        topicId={topic.id}
        authorized={topic.publicExposureAuthorized}
        status={topic.status}
      />

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

      <Link
        href={`/app/estudos?novo=1&topic=${topic.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
      >
        <BookOpen aria-hidden />
        Registrar estudo deste Topic
      </Link>
    </>
  );
}
