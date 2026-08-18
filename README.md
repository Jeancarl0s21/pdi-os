# PDI OS

Foundation repository for the PDI OS MVP. This phase materializes the approved technical foundation only; it does **not** declare Dashboard, Planning, Tasks, Roadmap, Studies, Projects, Portfolio, or any other MVP feature complete.

## Architecture boundary

- One application deployable: `apps/web` (Next.js App Router + TypeScript).
- PostgreSQL, Auth, and Storage: Supabase.
- UI implementation: Tailwind CSS + shadcn/ui, subordinate to the approved UI Master.
- Server-side authorization plus deny-by-default RLS; the browser is untrusted.
- Auth: `@supabase/ssr`, PKCE/cookies, no public signup.
- Seed is explicit/versioned/idempotent and never runs on application startup or inside migrations.
- No FastAPI, microservice, SaaS/billing, code runner, or other unapproved MVP scope in Foundation.

## Canonical precedence

PRD V1.0 → UX Master V1.0 → AMD-001 (Content only) → Research Master/Seed V1.2 → UI Master V1.0 → Architecture Master V1.0. See `docs/architecture/SOURCE_PRECEDENCE.md`.

## Local prerequisites

Node.js 22+, pnpm, Docker, Git, and the project-local Supabase CLI installed from this workspace.

```bash
pnpm install --frozen-lockfile
pnpm db:start
pnpm db:reset
pnpm db:lint
pnpm test:db
pnpm test
pnpm build
pnpm test:e2e
```

Real credentials belong only in local secret stores/platform secret settings. `.env.example` contains names/placeholders only.
