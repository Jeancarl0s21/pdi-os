"use client";

import { Check, Play } from "lucide-react";
import type { TopicStatus } from "@pdi-os/domain";
import { completeTopic, startTopic } from "@/lib/roadmap/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import { Button } from "@/components/ui/button";
import { TopicStatusBadge } from "./status-badge";

export function TopicActions({
  topicId,
  status,
  hasCompletedActivity,
}: {
  topicId: string;
  status: TopicStatus;
  hasCompletedActivity: boolean;
}) {
  const [start, starting] = useServerMutation(startTopic);
  const [complete, completing, completeResult] = useServerMutation(completeTopic);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <TopicStatusBadge status={status} />

        {status === "not_started" ? (
          <Button
            type="button"
            size="sm"
            disabled={starting}
            onClick={() => start({ id: topicId })}
          >
            <Play aria-hidden />
            Iniciar Topic
          </Button>
        ) : null}

        {status === "studying" ? (
          <Button
            type="button"
            size="sm"
            disabled={completing || !hasCompletedActivity}
            onClick={() => complete({ id: topicId })}
          >
            <Check aria-hidden />
            Concluir Topic
          </Button>
        ) : null}
      </div>

      {status === "studying" && !hasCompletedActivity ? (
        <p className="text-xs text-muted-foreground">
          Conclua ao menos uma Activity para poder finalizar o Topic.
        </p>
      ) : null}
      {completeResult && !completeResult.ok && completeResult.message ? (
        <p role="alert" className="text-xs text-destructive">
          {completeResult.message}
        </p>
      ) : null}
    </div>
  );
}
