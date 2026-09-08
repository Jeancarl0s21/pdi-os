import { signIn } from "../actions";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authenticated";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await redirectIfAuthenticated();
  const { error } = await searchParams;
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm text-muted-foreground">PDI OS</p>
        <h1 className="text-3xl font-semibold">Entrar</h1>
      </div>
      <form action={signIn} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span>E-mail</span>
          <input
            className="rounded-md border bg-muted px-3 py-2"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="flex flex-col gap-2">
          <span>Senha</span>
          <input
            className="rounded-md border bg-muted px-3 py-2"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível autenticar.
          </p>
        ) : null}
        <Button type="submit">Entrar</Button>
      </form>
      <a
        className="text-sm text-primary underline-offset-4 hover:underline"
        href="/forgot-password"
      >
        Esqueci minha senha
      </a>
    </>
  );
}
