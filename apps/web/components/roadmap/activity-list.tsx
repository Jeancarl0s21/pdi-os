"use client";

import { Check, ExternalLink, RotateCcw } from "lucide-react";
import { setActivityCompleted } from "@/lib/roadmap/actions";
import { useServerMutation } from "@/lib/hooks/use-server-mutation";
import type { RoadmapActivity } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EvidenceList } from "@/components/evidence/evidence-list";

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground/90">{value}</dd>
    </div>
  );
}

function ActivityCard({ activity }: { activity: RoadmapActivity }) {
  const done = activity.completedAt !== null;
  const [toggle, toggling] = useServerMutation(setActivityCompleted);
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
            done
              ? "border-[color:var(--pdi-success)] bg-[color:var(--pdi-success)]/20"
              : "border-border",
          )}
        >
          {done ? <Check className="size-3 text-[color:var(--pdi-success)]" /> : null}
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-foreground">{activity.title}</h3>
          <p className="text-sm text-muted-foreground">{activity.instruction}</p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Detail label="Ambiente" value={activity.externalEnvironment} />
        <Detail label="Contexto" value={activity.executionContext} />
        <Detail label="Dataset / fonte" value={activity.datasetOrSource} />
        <Detail label="Saída esperada" value={activity.expectedOutput} />
        <Detail label="Evidência sugerida" value={activity.suggestedEvidence} />
      </dl>

      {activity.resources.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {activity.resources.map((resource, index) => (
            <li
              key={index}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
            >
              {resource}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant={done ? "ghost" : "primary"}
          disabled={toggling}
          onClick={() => toggle({ id: activity.id, completed: done ? "false" : "true" })}
        >
          {done ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
          {done ? "Reabrir" : "Concluir"}
        </Button>

        {activity.externalUrl ? (
          <a
            href={activity.externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink aria-hidden className="size-4" />
            Abrir ambiente
          </a>
        ) : null}
      </div>

      <div className="border-t border-border pt-3">
        <EvidenceList context="activity" contextId={activity.id} items={activity.evidence} />
      </div>
    </li>
  );
}

export function ActivityList({ activities }: { activities: RoadmapActivity[] }) {
  if (activities.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Prática
      </h2>
      <ul className="flex flex-col gap-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </ul>
    </section>
  );
}
