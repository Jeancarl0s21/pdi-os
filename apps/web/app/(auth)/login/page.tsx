import { signIn } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <section className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-sm text-muted-foreground">PDI OS / AUTH FOUNDATION</p>
          <h1 className="text-3xl font-semibold">Entrar</h1>
        </div>
        <form action={signIn} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span>E-mail</span>
            <input className="rounded-md border bg-muted px-3 py-2" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="flex flex-col gap-2">
            <span>Senha</span>
            <input className="rounded-md border bg-muted px-3 py-2" name="password" type="password" autoComplete="current-password" required />
          </label>
          {error ? <p role="alert" className="text-sm text-destructive">Não foi possível autenticar.</p> : null}
          <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground" type="submit">Entrar</button>
        </form>
        <a className="text-sm text-primary underline-offset-4 hover:underline" href="/forgot-password">Esqueci minha senha</a>
      </section>
    </main>
  );
}
