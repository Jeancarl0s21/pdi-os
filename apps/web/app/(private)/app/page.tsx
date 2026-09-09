import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="O que precisa da sua atenção agora." />
      <EmptyState
        icon={<LayoutDashboard aria-hidden />}
        title="Dashboard em construção"
        description="O resumo de execução, estudo atual, Roadmap e quick actions chegam nos próximos slices."
      />
    </>
  );
}
