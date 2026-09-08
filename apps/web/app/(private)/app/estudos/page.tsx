import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export default function EstudosPage() {
  return (
    <>
      <PageHeader title="Estudos" description="O que estudei." />
      <EmptyState
        icon={<BookOpen aria-hidden />}
        title="Estudos em construção"
        description="A timeline cronológica, busca/filtros e a StudySession leve chegam num slice futuro."
      />
    </>
  );
}
