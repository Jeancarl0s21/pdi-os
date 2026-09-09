import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileLink, ProfileStatus, StackItem } from "./types";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_profiles")
    .select("name,headline,intro,about")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { name: data.name, headline: data.headline, intro: data.intro, about: data.about };
}

export async function getStatus(): Promise<ProfileStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_status")
    .select("company,role,focus,building_text,current_project_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    company: data.company,
    role: data.role,
    focus: data.focus,
    buildingText: data.building_text,
    currentProjectId: data.current_project_id,
  };
}

export async function listLinks(): Promise<ProfileLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_links")
    .select("id,type,label,href,position")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    label: row.label,
    href: row.href,
    position: row.position,
  }));
}

export async function listStackItems(): Promise<StackItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stack_items")
    .select("id,name,group_name,is_featured,position")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    groupName: row.group_name,
    isFeatured: row.is_featured,
    position: row.position,
  }));
}
