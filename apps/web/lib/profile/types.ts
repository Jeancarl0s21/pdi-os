export interface Profile {
  name: string;
  headline: string | null;
  intro: string | null;
  about: string | null;
}

export interface ProfileStatus {
  company: string | null;
  role: string | null;
  focus: string | null;
  buildingText: string | null;
  currentProjectId: string | null;
}

export interface ProfileLink {
  id: string;
  type: string | null;
  label: string;
  href: string;
  position: number;
}

export interface StackItem {
  id: string;
  name: string;
  groupName: string | null;
  isFeatured: boolean;
  position: number;
}
