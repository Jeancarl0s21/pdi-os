"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const primary = NAV_ITEMS.filter((item) => item.group === "primary");
  const secondary = NAV_ITEMS.filter((item) => item.group === "secondary");

  return (
    <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1">
      {primary.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
      {secondary.length > 0 ? (
        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
          {secondary.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </nav>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isNavItemActive(item.href, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}
