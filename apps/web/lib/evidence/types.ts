export type EvidenceContext = "activity" | "study";

export interface Evidence {
  id: string;
  kind: "link" | "file";
  title: string | null;
  externalUrl: string | null;
  fileName: string | null;
  fileUrl: string | null;
}
