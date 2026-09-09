import "server-only";
import type { PublicPortfolio, PublicPortfolioProject } from "@pdi-os/domain";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/validation/env";
import { PUBLIC_BUCKET } from "@/lib/projects/storage";

export interface PublicPortfolioProjectView extends PublicPortfolioProject {
  coverUrl: string | null;
}

export interface PublicPortfolioView extends Omit<PublicPortfolio, "projects"> {
  projects: PublicPortfolioProjectView[];
}

/** Public URL for an object already mirrored into the public bucket (PR-2). */
function publicCoverUrl(coverPath: string | null): string | null {
  if (!coverPath) return null;
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${coverPath}`;
}

/**
 * The visitor-facing Portfolio. Single call to the SECURITY DEFINER RPC
 * public.get_public_portfolio() — anon never touches a raw domain table, and a
 * draft Project can never come back (the RPC filters publication_status).
 */
export async function getPublicPortfolio(): Promise<PublicPortfolioView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_portfolio");
  if (error) throw error;

  const dto = data as PublicPortfolio | null;
  if (!dto) return null;

  return {
    profile: dto.profile,
    status: dto.status,
    links: dto.links ?? [],
    stack: dto.stack ?? [],
    currentlyStudying: dto.currentlyStudying ?? [],
    projects: (dto.projects ?? []).map((project) => ({
      ...project,
      coverUrl: publicCoverUrl(project.coverPath),
    })),
  };
}
