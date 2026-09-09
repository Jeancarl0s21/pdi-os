import Link from "next/link";
import { BookOpen, FolderGit2, Map } from "lucide-react";
import { PROJECT_EXECUTION_STATUS_LABELS, type ProjectExecutionStatus } from "@pdi-os/domain";
import { PageHeader } from "@/components/shell/page-header";
import { DashboardCard } from "@/components/dashboard/card";
import { PendingTasks } from "@/components/dashboard/pending-tasks";
import { ProgressBar } from "@/components/roadmap/progress-bar";
import { QuickTaskInput } from "@/components/tasks/quick-task-input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/lib/dashboard/queries";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function DashboardPage() {
  const dash = await getDashboard();

  const countCards = [
    { label: "Pendentes", value: dash.counts.pending, alert: false },
    { label: "Atrasadas", value: dash.counts.overdue, alert: dash.counts.overdue > 0 },
    { label: "Concluídas", value: dash.counts.done, alert: false },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="O que precisa da sua atenção agora." />

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Ações rápidas
        </h2>
        <QuickTaskInput />
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/app/estudos?novo=1"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <BookOpen aria-hidden />
            Registrar estudo
          </Link>
          {dash.studyingTopic ? (
            <Link
              href={`/app/roadmap/${dash.studyingTopic.moduleId}/${dash.studyingTopic.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Map aria-hidden />
              Continuar Topic
            </Link>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo de Tasks">
        {countCards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-1 rounded-lg border border-border bg-card px-5 py-4"
          >
            <span className="text-sm text-muted-foreground">{card.label}</span>
            <span
              className={cn(
                "text-3xl font-semibold tabular-nums",
                card.alert ? "text-destructive" : "text-foreground",
              )}
            >
              {card.value}
            </span>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard title="Tasks pendentes" href="/app/tarefas" hrefLabel="Ver Tasks">
          <PendingTasks tasks={dash.pendingTasks} />
        </DashboardCard>

        <DashboardCard title="Estudo" href="/app/roadmap" hrefLabel="Ver Roadmap">
          <div className="flex flex-col gap-3">
            {dash.studyingTopic ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Estudando agora</span>
                <Link
                  href={`/app/roadmap/${dash.studyingTopic.moduleId}/${dash.studyingTopic.id}`}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {dash.studyingTopic.title}
                </Link>
                <span className="font-mono text-xs text-muted-foreground">
                  {dash.studyingTopic.moduleTitle}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum Topic em estudo.</p>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Progresso do Roadmap</span>
              <ProgressBar progress={dash.roadmap} />
            </div>

            {dash.recentStudy.length > 0 ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Estudo recente</span>
                <ul className="flex flex-col gap-1">
                  {dash.recentStudy.map((s) => (
                    <li key={s.id} className="flex justify-between gap-2 text-sm">
                      <span className="truncate text-foreground">{s.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(s.studiedOn)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </DashboardCard>

        <DashboardCard title="Projects" href="/app/projetos" hrefLabel="Ver Projects">
          {dash.recentProjects.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {dash.recentProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/app/projetos/${p.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 hover:border-primary/50"
                  >
                    <span className="truncate text-sm text-foreground">{p.name}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {PROJECT_EXECUTION_STATUS_LABELS[p.executionStatus as ProjectExecutionStatus]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderGit2 aria-hidden className="size-4" />
              Nenhum Project ainda.
            </p>
          )}
        </DashboardCard>

        <DashboardCard title="Atividade recente">
          {dash.recentActivity.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {dash.recentActivity.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sem atividade recente.</p>
          )}
        </DashboardCard>
      </div>
    </>
  );
}
