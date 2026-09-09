import { NavList } from "./nav-list";
import { UserMenu } from "./user-menu";

export function AppSidebar({ email }: { email: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-border bg-background px-4 py-5 lg:flex">
      <div className="px-3">
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          PDI OS
        </span>
      </div>
      <NavList />
      <UserMenu email={email} />
    </aside>
  );
}
