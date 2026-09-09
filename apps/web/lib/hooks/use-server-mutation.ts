"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";

type ServerAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/**
 * Fire a one-shot server action (move / archive / restore / …) from a button and
 * refresh the server tree on success. Returns `[run, pending]`.
 */
export function useServerMutation(
  action: ServerAction,
): [(fields: Record<string, string>) => void, boolean] {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    (fields: Record<string, string>) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(fields)) formData.set(key, value);
      startTransition(async () => {
        const result = await action({ ok: false }, formData);
        if (result.ok) router.refresh();
      });
    },
    [action, router],
  );

  return [run, pending];
}
