import { CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export default function PlanejamentoPage() {
  return (
    <>
      <PageHeader title="Planejamento" description="Em que devo focar neste período." />
      <EmptyState
        icon={<CalendarRange aria-hidden />}
        title="Planejamento em construção"
        description="A visão temporal das Tasks (semana, mês, próximos 7 dias, atrasadas, sem prazo) chega no Slice 1."
      />
    </>
  );
}
