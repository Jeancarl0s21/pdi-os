import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/shell/app-shell";

export default async function PrivateAppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <AppShell email={user.email ?? "conta"}>{children}</AppShell>;
}
