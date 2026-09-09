import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export default function PerfilPage() {
  return (
    <>
      <PageHeader title="Perfil" description="O que a landing e o público exibem." />
      <EmptyState
        icon={<Settings aria-hidden />}
        title="Perfil e Configurações em construção"
        description="Conteúdo profissional, Sobre/Trajetória, Links, Stack e exposição pública chegam junto do Portfolio."
      />
    </>
  );
}
