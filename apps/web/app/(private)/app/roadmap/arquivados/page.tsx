import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ArchivedRoadmap } from "@/components/roadmap/archived-roadmap";
import { buttonVariants } from "@/components/ui/button";
import { getRoadmapArchived } from "@/lib/roadmap/queries";

export default async function RoadmapArchivedPage() {
  const archived = await getRoadmapArchived();

  return (
    <>
      <PageHeader
        title="Roadmap arquivado"
        description="Modules e Topics fora da experiência principal, ainda consultáveis."
        actions={
          <Link href="/app/roadmap" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden />
            Roadmap
          </Link>
        }
      />
      <ArchivedRoadmap archived={archived} />
    </>
  );
}
