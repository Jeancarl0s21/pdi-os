import type { PublicPortfolioProfile, PublicPortfolioStackItem } from "@pdi-os/domain";

/** Sobre/Trajetória and Stack in an asymmetric two-column composition (UX §8.1). */
export function AboutStack({
  profile,
  stack,
}: {
  profile: PublicPortfolioProfile;
  stack: PublicPortfolioStackItem[];
}) {
  if (!profile.about && stack.length === 0) return null;

  const groups = new Map<string, PublicPortfolioStackItem[]>();
  for (const item of stack) {
    const key = item.groupName ?? "Geral";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <section className="grid gap-10 border-t border-border py-12 md:grid-cols-[3fr_2fr]">
      {profile.about ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Sobre
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {profile.about}
          </p>
        </div>
      ) : (
        <div />
      )}

      {stack.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Stack
          </h2>
          {[...groups.entries()].map(([group, items]) => (
            <div key={group} className="flex flex-col gap-1.5">
              <p className="font-mono text-xs text-muted-foreground">{group}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <span
                    key={item.name}
                    className={
                      item.isFeatured
                        ? "rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                        : "rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                    }
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
