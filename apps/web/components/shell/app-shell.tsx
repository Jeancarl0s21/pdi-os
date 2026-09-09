import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <AppSidebar email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav email={email} />
        <main id="conteudo" className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
