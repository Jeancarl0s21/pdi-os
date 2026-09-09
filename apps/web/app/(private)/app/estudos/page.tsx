import { toISODate } from "@pdi-os/domain";
import { PageHeader } from "@/components/shell/page-header";
import { StudyView } from "@/components/study/study-view";
import { listModuleRefs, listStudySessions, listTopicRefs } from "@/lib/study/queries";
import { listProjects } from "@/lib/projects/queries";
import { listEvidenceByContext } from "@/lib/evidence/queries";
import type { StudySessionFilters } from "@/lib/study/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EstudosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters: StudySessionFilters = {};
  const from = str(sp.from);
  const to = str(sp.to);
  const topic = str(sp.topic);
  const moduleId = str(sp.module);
  const project = str(sp.project);
  if (from && DATE_RE.test(from)) filters.from = from;
  if (to && DATE_RE.test(to)) filters.to = to;
  if (str(sp.noTopic) === "1") filters.noTopic = true;
  else if (topic && UUID_RE.test(topic)) filters.topicId = topic;
  else if (moduleId && UUID_RE.test(moduleId)) filters.moduleId = moduleId;
  if (project && UUID_RE.test(project)) filters.projectId = project;

  const [sessions, topics, modules, projects] = await Promise.all([
    listStudySessions(filters),
    listTopicRefs(),
    listModuleRefs(),
    listProjects(),
  ]);

  const prefillTopicId = filters.topicId && str(sp.novo) === "1" ? filters.topicId : undefined;

  const evidenceMap = await listEvidenceByContext(
    "study",
    sessions.map((s) => s.id),
  );
  const evidenceBySession = Object.fromEntries(evidenceMap);

  return (
    <>
      <PageHeader title="Estudos" description="Registro cronológico do que estudei." />
      <StudyView
        sessions={sessions}
        evidenceBySession={evidenceBySession}
        topics={topics}
        modules={modules}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        today={toISODate(new Date())}
        openNew={str(sp.novo) === "1"}
        prefillTopicId={prefillTopicId}
      />
    </>
  );
}
