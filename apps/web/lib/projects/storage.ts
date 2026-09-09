import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const COVER_BUCKET = "project-covers";
export const PUBLIC_BUCKET = "portfolio-assets";
export const COVER_SIGNED_URL_TTL = 3600;

/** Object path for a project's cover. First segment is the owner uid (Storage RLS). */
export function coverObjectPath(userId: string, projectId: string): string {
  return `${userId}/${projectId}/cover`;
}

/**
 * Mirror the private cover into the public bucket at the same path — done on
 * publish and on cover replacement while published (RN-PROJECT-014). The public
 * copy is left orphan on unpublish (no cleanup in the MVP).
 */
export async function mirrorCoverToPublic(
  supabase: SupabaseClient,
  coverPath: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .copy(coverPath, coverPath, { destinationBucket: PUBLIC_BUCKET });
  if (error) throw error;
}
