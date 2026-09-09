import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { getTaskCounts } from "@/lib/tasks/queries";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const counts = await getTaskCounts();

  const cards = [
    { label: "Pendentes", value: counts.pending, emphasised: false },
    { label: "Atrasadas", value: counts.overdue, emphasised: counts.overdue > 0 },
    { label: "Concluídas", value: counts.done, emphasised: false },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="O que precisa da sua atenção agora." />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo de Tasks">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-1 rounded-lg border border-border bg-card px-5 py-4"
          >
            <span className="text-sm text-muted-foreground">{card.label}</span>
            <span
              className={cn(
                "text-3xl font-semibold tabular-nums",
                card.emphasised ? "text-destructive" : "text-foreground",
              )}
            >
              {card.value}
            </span>
          </div>
        ))}
      </section>

      <Link href="/app/tarefas" className="text-sm text-primary underline-offset-4 hover:underline">
        Ver todas as Tasks →
      </Link>
    </>
  );
}
