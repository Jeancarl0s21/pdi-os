import type { ContentDidacticBody, RoadmapProgress, TopicStatus } from "@pdi-os/domain";

export interface RoadmapModuleSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  editorialPriority: string | null;
  progress: RoadmapProgress;
}

export interface RoadmapOverview {
  track: { id: string; title: string; description: string | null } | null;
  modules: RoadmapModuleSummary[];
  progress: RoadmapProgress;
}

export interface RoadmapTopicSummary {
  id: string;
  slug: string;
  title: string;
  status: TopicStatus;
  recommendedLevel: string | null;
  position: number;
}

export interface RoadmapModuleDetail {
  id: string;
  title: string;
  description: string | null;
  progress: RoadmapProgress;
  topics: RoadmapTopicSummary[];
}

export interface RoadmapArchivedModule {
  id: string;
  title: string;
}

export interface RoadmapArchivedTopic {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
}

export interface RoadmapArchived {
  modules: RoadmapArchivedModule[];
  topics: RoadmapArchivedTopic[];
}

export interface RoadmapContent {
  id: string;
  title: string;
  completedAt: string | null;
  body: ContentDidacticBody;
}

export interface RoadmapActivity {
  id: string;
  title: string;
  instruction: string;
  externalEnvironment: string | null;
  executionContext: string | null;
  datasetOrSource: string | null;
  expectedOutput: string | null;
  suggestedEvidence: string | null;
  externalUrl: string | null;
  resources: string[];
  completedAt: string | null;
}

export interface RoadmapMaterial {
  id: string;
  title: string;
  type: string;
  source: string;
  url: string;
}

export interface RoadmapTopicDetail {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: TopicStatus;
  recommendedLevel: string | null;
  contents: RoadmapContent[];
  activities: RoadmapActivity[];
  materials: RoadmapMaterial[];
}
