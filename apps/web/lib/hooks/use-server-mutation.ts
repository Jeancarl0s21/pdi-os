"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";

type ServerAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

function toFormData(input: Record<string, string> | FormData): FormData {
  if (input instanceof FormData) return input;
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) formData.set(key, value);
  return formData;
}

/**
 * Fire a one-shot server action (move / archive / publish / upload / …) from a
 * button and refresh the server tree on success. Returns `[run, pending]`;
 * `run` accepts a plain field map or a ready `FormData` (for file uploads).
 */
export function useServerMutation(
  action: ServerAction,
): [(input: Record<string, string> | FormData) => void, boolean] {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    (input: Record<string, string> | FormData) => {
      const formData = toFormData(input);
      startTransition(async () => {
        const result = await action({ ok: false }, formData);
        if (result.ok) router.refresh();
      });
    },
    [action, router],
  );

  return [run, pending];
}
