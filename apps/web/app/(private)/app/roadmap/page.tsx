import { Map } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export default function RoadmapPage() {
  return (
    <>
      <PageHeader title="Roadmap" description="O que preciso aprender e praticar." />
      <EmptyState
        icon={<Map aria-hidden />}
        title="Roadmap em construção"
        description="Track, Modules, Topics, busca e progresso derivado chegam num slice futuro."
      />
    </>
  );
}
