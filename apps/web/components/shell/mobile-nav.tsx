"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavList } from "./nav-list";
import { UserMenu } from "./user-menu";

export function MobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          PDI OS
        </span>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Abrir navegação"
          onClick={() => setOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navegação">
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col gap-4 border-r border-border bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                PDI OS
              </span>
              <button
                type="button"
                aria-label="Fechar navegação"
                onClick={() => setOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <UserMenu email={email} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
