import type { RoadmapProgress } from "@pdi-os/domain";

export function ProgressBar({ progress }: { progress: RoadmapProgress }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={progress.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progress.completed} de ${progress.total} topics concluídos`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${progress.pct}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {progress.completed}/{progress.total}
      </span>
    </div>
  );
}
