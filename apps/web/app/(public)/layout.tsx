import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Public shell for the Portfolio landing (RN-PORTFOLIO-001). No AppShell, no
 * auth requirement. A signed-in visitor gets a discreet way back into the app;
 * anonymous visitors just see the landing.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-mono text-sm text-muted-foreground">PDI OS</span>
        <Link
          href={user ? "/app" : "/login"}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {user ? "Entrar no app →" : "Entrar"}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 pb-24">{children}</main>
    </div>
  );
}
