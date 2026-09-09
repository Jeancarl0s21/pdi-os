import type { PublicPortfolioProfile, PublicPortfolioStatus } from "@pdi-os/domain";

export function Hero({
  profile,
  status,
}: {
  profile: PublicPortfolioProfile;
  status: PublicPortfolioStatus | null;
}) {
  const statusBits = [status?.role, status?.company].filter(Boolean).join(" · ");

  return (
    <section className="flex flex-col gap-4 py-12 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">Portfolio</p>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {profile.name}
      </h1>
      {profile.headline ? (
        <p className="max-w-2xl text-lg text-muted-foreground">{profile.headline}</p>
      ) : null}
      {profile.intro ? (
        <p className="max-w-2xl whitespace-pre-wrap text-sm text-foreground/80">{profile.intro}</p>
      ) : null}

      {statusBits || status?.focus || status?.building ? (
        <dl className="mt-4 flex flex-col gap-1 border-l-2 border-border pl-4 text-sm">
          {statusBits ? (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Agora</dt>
              <dd className="text-foreground">{statusBits}</dd>
            </div>
          ) : null}
          {status?.focus ? (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Foco</dt>
              <dd className="text-foreground">{status.focus}</dd>
            </div>
          ) : null}
          {status?.building ? (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Construindo</dt>
              <dd className="text-foreground">{status.building}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
