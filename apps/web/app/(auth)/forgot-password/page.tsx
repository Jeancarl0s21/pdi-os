import { requestPasswordReset } from "../actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <section className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-sm text-muted-foreground">PDI OS / AUTH FOUNDATION</p>
          <h1 className="text-3xl font-semibold">Recuperar senha</h1>
        </div>
        {sent ? (
          <p>Se a conta existir, as instruções de redefinição serão enviadas.</p>
        ) : (
          <form action={requestPasswordReset} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span>E-mail</span>
              <input className="rounded-md border bg-muted px-3 py-2" name="email" type="email" autoComplete="email" required />
            </label>
            <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground" type="submit">Solicitar redefinição</button>
          </form>
        )}
      </section>
    </main>
  );
}
