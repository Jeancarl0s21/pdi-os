"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060b14",
          color: "#f3f7ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Algo deu errado</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#94a3b8" }}>
            Ocorreu uma falha inesperada. Tente novamente.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              borderRadius: 6,
              border: 0,
              background: "#4ea1ff",
              color: "#060b14",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
