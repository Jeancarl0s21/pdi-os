import { updatePassword } from "../actions";
import { Button } from "@/components/ui/button";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm text-muted-foreground">PDI OS</p>
        <h1 className="text-3xl font-semibold">Definir nova senha</h1>
      </div>
      <form action={updatePassword} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span>Nova senha</span>
          <input
            className="rounded-md border bg-muted px-3 py-2"
            name="password"
            type="password"
            minLength={14}
            autoComplete="new-password"
            required
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível atualizar a senha.
          </p>
        ) : null}
        <Button type="submit">Atualizar senha</Button>
      </form>
    </>
  );
}
