"use client";

import type { TopicStatus } from "@pdi-os/domain";
import { setTopicPublicExposure } from "@/lib/roadmap/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";

export function PublicExposureToggle({
  topicId,
  authorized,
  status,
}: {
  topicId: string;
  authorized: boolean;
  status: TopicStatus;
}) {
  const [toggle, pending] = useServerMutation(setTopicPublicExposure);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={authorized}
          disabled={pending}
          onChange={(e) => toggle({ id: topicId, authorized: e.target.checked ? "true" : "false" })}
        />
        Exibir no Portfolio enquanto estou estudando
      </label>
      <p className="text-xs text-muted-foreground">
        {status === "studying"
          ? "Aparece agora na seção “Atualmente estudando” da landing pública."
          : "A autorização fica guardada; o Topic só aparece publicamente enquanto o status for “Estudando”."}
      </p>
    </div>
  );
}
