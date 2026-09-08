export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-48 w-full animate-pulse rounded-lg border border-dashed border-border bg-card/40" />
    </div>
  );
}
