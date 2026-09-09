import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RoadmapTopicSummary } from "@/lib/roadmap/types";
import { TopicStatusBadge } from "./status-badge";

export function TopicList({
  moduleId,
  topics,
}: {
  moduleId: string;
  topics: RoadmapTopicSummary[];
}) {
  return (
    <ul className="flex flex-col gap-2">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link
            href={`/app/roadmap/${moduleId}/${topic.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm font-medium text-foreground">{topic.title}</span>
              {topic.recommendedLevel ? (
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {topic.recommendedLevel}
                </span>
              ) : null}
            </div>
            <TopicStatusBadge status={topic.status} />
            <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
