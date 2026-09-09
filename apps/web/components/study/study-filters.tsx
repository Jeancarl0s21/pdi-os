"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function StudyFilters({
  topics,
  modules,
  projects,
}: {
  topics: { id: string; title: string }[];
  modules: { id: string; title: string }[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      // Topic / module / sem-Topic are mutually exclusive scoping controls.
      if (key === "topic" && value) {
        next.delete("module");
        next.delete("noTopic");
      }
      if (key === "module" && value) {
        next.delete("topic");
        next.delete("noTopic");
      }
      if (key === "noTopic" && value) {
        next.delete("topic");
        next.delete("module");
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const hasFilters = ["from", "to", "topic", "module", "project", "noTopic"].some((k) =>
    params.get(k),
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          De
          <Input
            type="date"
            value={params.get("from") ?? ""}
            onChange={(e) => set("from", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Até
          <Input
            type="date"
            value={params.get("to") ?? ""}
            onChange={(e) => set("to", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Topic
          <Select value={params.get("topic") ?? ""} onChange={(e) => set("topic", e.target.value)}>
            <option value="">Todos</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Module
          <Select
            value={params.get("module") ?? ""}
            onChange={(e) => set("module", e.target.value)}
          >
            <option value="">Todos</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Project
          <Select
            value={params.get("project") ?? ""}
            onChange={(e) => set("project", e.target.value)}
          >
            <option value="">Todos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 self-end text-sm text-foreground">
          <input
            type="checkbox"
            checked={params.get("noTopic") === "1"}
            onChange={(e) => set("noTopic", e.target.checked ? "1" : "")}
          />
          Sem Topic
        </label>
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="self-start text-xs text-primary hover:underline"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}
