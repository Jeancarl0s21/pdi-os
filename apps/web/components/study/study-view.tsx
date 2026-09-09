"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { StudySession } from "@/lib/study/types";
import { Button } from "@/components/ui/button";
import { StudyFilters } from "./study-filters";
import { SessionList } from "./session-list";
import { SessionForm } from "./session-form";

export function StudyView({
  sessions,
  topics,
  modules,
  projects,
  today,
  openNew,
  prefillTopicId,
}: {
  sessions: StudySession[];
  topics: { id: string; title: string }[];
  modules: { id: string; title: string }[];
  projects: { id: string; name: string }[];
  today: string;
  openNew: boolean;
  prefillTopicId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [creating, setCreating] = useState(openNew);
  const [editing, setEditing] = useState<StudySession | null>(null);

  function closeCreate() {
    setCreating(false);
    if (params.get("novo") || params.get("topic")) {
      const next = new URLSearchParams(params);
      next.delete("novo");
      // keep an existing `topic` filter, but drop the one-shot prefill
      if (prefillTopicId && next.get("topic") === prefillTopicId) next.delete("topic");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Registrar estudo
        </Button>
      </div>

      <StudyFilters topics={topics} modules={modules} projects={projects} />
      <SessionList sessions={sessions} onEdit={setEditing} />

      {creating ? (
        <SessionForm
          onClose={closeCreate}
          defaultDate={today}
          defaultTopicId={prefillTopicId}
          topics={topics}
          projects={projects}
        />
      ) : null}
      {editing ? (
        <SessionForm
          onClose={() => setEditing(null)}
          session={editing}
          defaultDate={today}
          topics={topics}
          projects={projects}
        />
      ) : null}
    </div>
  );
}
