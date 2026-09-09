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
  coverPath: string | null;
  /** Signed URL for the private cover — resolved by `getProject`, null elsewhere. */
  coverUrl: string | null;
  technologies: string[];
  updatedAt: string;
}
