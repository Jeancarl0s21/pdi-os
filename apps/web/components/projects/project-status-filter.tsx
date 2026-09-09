import Link from "next/link";
import { PROJECT_EXECUTION_STATUSES, PROJECT_EXECUTION_STATUS_LABELS } from "@pdi-os/domain";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "", label: "Ativos" },
  ...PROJECT_EXECUTION_STATUSES.map((status) => ({
    value: status,
    label: PROJECT_EXECUTION_STATUS_LABELS[status],
  })),
];

export function ProjectStatusFilter({ active = "" }: { active?: string }) {
  return (
    <div role="group" aria-label="Filtrar por status" className="flex gap-2 overflow-x-auto pb-1">
      {OPTIONS.map((option) => {
        const isActive = active === option.value;
        return (
          <Link
            key={option.value || "all"}
            href={option.value ? `/app/projetos?status=${option.value}` : "/app/projetos"}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
