import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <section className="flex w-full flex-col gap-6">{children}</section>
    </main>
  );
}
