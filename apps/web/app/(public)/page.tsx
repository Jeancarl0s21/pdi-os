import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// A landing pública real (Portfolio, WF-01) é escopo de um slice futuro.
// Por ora, "/" apenas encaminha conforme o estado da sessão.
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/app" : "/login");
}
