import { PageHeader } from "@/components/shell/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { StatusForm } from "@/components/profile/status-form";
import { LinksEditor } from "@/components/profile/links-editor";
import { StackEditor } from "@/components/profile/stack-editor";
import { getProfile, getStatus, listLinks, listStackItems } from "@/lib/profile/queries";
import { listPublishedProjectRefs } from "@/lib/projects/queries";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default async function PerfilPage() {
  const [profile, status, links, stack, publishedProjects] = await Promise.all([
    getProfile(),
    getStatus(),
    listLinks(),
    listStackItems(),
    listPublishedProjectRefs(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Perfil"
        description="A fonte única do conteúdo que a landing pública exibe."
      />

      <Section title="Perfil profissional" description="Nome, headline, introdução e Sobre.">
        <ProfileForm profile={profile} />
      </Section>

      <Section title="Agora" description="Empresa, cargo, foco e o que você está construindo.">
        <StatusForm status={status} publishedProjects={publishedProjects} />
      </Section>

      <Section title="Links" description="GitHub, LinkedIn, contato e outros.">
        <LinksEditor links={links} />
      </Section>

      <Section title="Stack" description="Itens exibidos na seção Stack da landing.">
        <StackEditor items={stack} />
      </Section>
    </div>
  );
}
