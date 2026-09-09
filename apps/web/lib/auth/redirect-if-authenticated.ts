import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Guard for public auth pages (login, forgot-password): an already-authenticated
// visitor is sent straight to the private app. Not used on reset-password, which
// runs on a valid recovery session.
export async function redirectIfAuthenticated(to = "/app") {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(to);
}
