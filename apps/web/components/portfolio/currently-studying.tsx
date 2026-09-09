import type { PublicPortfolioStudyingTopic } from "@pdi-os/domain";

export function CurrentlyStudying({ topics }: { topics: PublicPortfolioStudyingTopic[] }) {
  if (topics.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-border py-12">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Atualmente estudando
      </h2>
      <ul className="flex flex-col gap-2">
        {topics.map((topic) => (
          <li key={`${topic.moduleTitle ?? ""}-${topic.title}`} className="flex flex-col">
            <span className="text-sm text-foreground">{topic.title}</span>
            {topic.moduleTitle ? (
              <span className="font-mono text-xs text-muted-foreground">{topic.moduleTitle}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
