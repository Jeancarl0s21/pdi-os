import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Página não encontrada
      </h1>
      <p className="text-sm text-muted-foreground">Esta tela não existe ou o item foi removido.</p>
      <Link href="/app" className="text-sm text-primary underline-offset-4 hover:underline">
        ← Voltar ao Dashboard
      </Link>
    </div>
  );
}
