import "server-only";

export const EVIDENCE_BUCKET = "evidence-files";
export const EVIDENCE_SIGNED_URL_TTL = 3600;

/** First path segment must be the owner uid (Storage RLS). */
export function evidenceObjectPath(userId: string, evidenceId: string, filename: string): string {
  const safe = filename.replace(/[^\w.-]+/g, "_").slice(-80) || "arquivo";
  return `${userId}/${evidenceId}/${safe}`;
}
