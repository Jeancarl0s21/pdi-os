import {
  BookOpen,
  CalendarRange,
  FolderGit2,
  LayoutDashboard,
  ListTodo,
  Map,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "primary" | "secondary";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: NavGroup;
}

// Ordem e naming conforme UX Master V1.0, UX-DEC-002. Slugs em PT-BR.
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, group: "primary" },
  { href: "/app/planejamento", label: "Planejamento", icon: CalendarRange, group: "primary" },
  { href: "/app/tarefas", label: "Tasks", icon: ListTodo, group: "primary" },
  { href: "/app/roadmap", label: "Roadmap", icon: Map, group: "primary" },
  { href: "/app/estudos", label: "Estudos", icon: BookOpen, group: "primary" },
  { href: "/app/projetos", label: "Projects", icon: FolderGit2, group: "primary" },
  { href: "/app/perfil", label: "Perfil", icon: Settings, group: "secondary" },
] as const;

export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/app") return pathname === "/app";
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}
