import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectEditor } from "@/components/projects/project-editor";
import { buttonVariants } from "@/components/ui/button";

export default function NovoProjetoPage() {
  return (
    <>
      <PageHeader
        title="Novo Project"
        description="Nasce como Rascunho — publicar vem depois."
        actions={
          <Link href="/app/projetos" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden />
            Projects
          </Link>
        }
      />
      <ProjectEditor mode="create" />
    </>
  );
}
