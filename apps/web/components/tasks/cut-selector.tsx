"use client";

import { PLANNING_CUTS, PLANNING_CUT_LABELS, type PlanningCut } from "@pdi-os/domain";
import { cn } from "@/lib/utils";

export function CutSelector({
  value,
  onChange,
}: {
  value: PlanningCut;
  onChange: (cut: PlanningCut) => void;
}) {
  return (
    <div role="group" aria-label="Recorte temporal" className="flex gap-2 overflow-x-auto pb-1">
      {PLANNING_CUTS.map((cut) => {
        const active = cut === value;
        return (
          <button
            key={cut}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(cut)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {PLANNING_CUT_LABELS[cut]}
          </button>
        );
      })}
    </div>
  );
}
