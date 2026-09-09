import Link from "next/link";
import { Archive, Map } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { ModuleManager } from "@/components/roadmap/module-manager";
import { ProgressBar } from "@/components/roadmap/progress-bar";
import { buttonVariants } from "@/components/ui/button";
import { getRoadmapOverview } from "@/lib/roadmap/queries";

export default async function RoadmapPage() {
  const { track, modules, progress } = await getRoadmapOverview();

  if (!track) {
    return (
      <>
        <PageHeader title="Roadmap" description="O que preciso aprender e praticar." />
        <EmptyState
          icon={<Map aria-hidden />}
          title="Roadmap ainda não importado"
          description="O conteúdo do Track chega pelo import do roadmap; assim que existir, os Modules aparecem aqui."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={track.title}
        description={track.description ?? "O que preciso aprender e praticar."}
        actions={
          <Link
            href="/app/roadmap/arquivados"
            className={buttonVariants({ variant: "ghost" })}
          >
            <Archive aria-hidden />
            Arquivados
          </Link>
        }
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Progresso do Track</span>
        <ProgressBar progress={progress} />
      </div>
      <ModuleManager trackId={track.id} modules={modules} />
    </>
  );
}
