import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">O endereço não existe ou foi movido.</p>
      <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
        ← Voltar ao início
      </Link>
    </div>
  );
}
