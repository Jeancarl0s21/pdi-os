"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export function UserMenu({ email, align = "start" }: { email: string; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-left text-sm",
          "transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary"
        >
          {email.slice(0, 2)}
        </span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{email}</span>
        <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Conta"
          className={cn(
            "absolute bottom-full z-50 mb-2 w-full min-w-48 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              <LogOut aria-hidden className="size-4" />
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
