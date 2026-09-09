import type { ProjectExecutionStatus, ProjectPublicationStatus } from "@pdi-os/domain";

export interface Project {
  id: string;
  name: string;
  shortDescription: string | null;
  fullDescription: string | null;
  executionStatus: ProjectExecutionStatus;
  publicationStatus: ProjectPublicationStatus;
  githubUrl: string | null;
  demoUrl: string | null;
  projectDate: string | null;
  technologies: string[];
  updatedAt: string;
}
