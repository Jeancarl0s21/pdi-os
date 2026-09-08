import { requestPasswordReset } from "../actions";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authenticated";
import { Button } from "@/components/ui/button";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  await redirectIfAuthenticated();
  const { sent } = await searchParams;
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm text-muted-foreground">PDI OS</p>
        <h1 className="text-3xl font-semibold">Recuperar senha</h1>
      </div>
      {sent ? (
        <p>Se a conta existir, as instruções de redefinição serão enviadas.</p>
      ) : (
        <form action={requestPasswordReset} className="flex flex-col gap-4">
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
          <Button type="submit">Solicitar redefinição</Button>
        </form>
      )}
      <a className="text-sm text-primary underline-offset-4 hover:underline" href="/login">
        Voltar para entrar
      </a>
    </>
  );
}
