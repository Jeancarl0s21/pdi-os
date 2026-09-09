"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <h1 className="text-lg font-semibold text-foreground">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Não foi possível carregar esta tela. Você pode tentar de novo.
        {error.digest ? (
          <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">
            ref {error.digest}
          </span>
        ) : null}
      </p>
      <Button type="button" onClick={reset}>
        <RotateCcw aria-hidden />
        Tentar de novo
      </Button>
    </div>
  );
}
