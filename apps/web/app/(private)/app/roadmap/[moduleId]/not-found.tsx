import Link from "next/link";

export default function RoadmapNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Item do Roadmap não encontrado
      </h1>
      <p className="text-sm text-muted-foreground">
        Ele pode ter sido arquivado ou o link está errado.
      </p>
      <Link href="/app/roadmap" className="text-sm text-primary underline-offset-4 hover:underline">
        ← Voltar para o Roadmap
      </Link>
    </div>
  );
}
