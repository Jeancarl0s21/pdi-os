import { Map } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { ModuleList } from "@/components/roadmap/module-list";
import { ProgressBar } from "@/components/roadmap/progress-bar";
import { getRoadmapOverview } from "@/lib/roadmap/queries";

export default async function RoadmapPage() {
  const { track, modules, progress } = await getRoadmapOverview();

  if (!track || modules.length === 0) {
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
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Progresso do Track</span>
        <ProgressBar progress={progress} />
      </div>
      <ModuleList modules={modules} />
    </>
  );
}
