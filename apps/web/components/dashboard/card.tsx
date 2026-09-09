import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function DashboardCard({
  title,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {hrefLabel ?? "Ver tudo"}
            <ArrowRight aria-hidden className="size-3" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
