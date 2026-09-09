import { FolderGit2 } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/feedback/empty-state";

export default function ProjetosPage() {
  return (
    <>
      <PageHeader title="Projects" description="O que estou construindo e o que publico." />
      <EmptyState
        icon={<FolderGit2 aria-hidden />}
        title="Projects em construção"
        description="Lista, editor dedicado, Preview e publicação no Portfolio chegam no Slice 2."
      />
    </>
  );
}
