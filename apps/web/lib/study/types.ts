export interface StudySession {
  id: string;
  studiedOn: string;
  title: string;
  note: string | null;
  durationMinutes: number | null;
  topicId: string | null;
  topicTitle: string | null;
  projectId: string | null;
  projectName: string | null;
}

export interface StudySessionFilters {
  from?: string;
  to?: string;
  topicId?: string;
  moduleId?: string;
  projectId?: string;
  noTopic?: boolean;
}
