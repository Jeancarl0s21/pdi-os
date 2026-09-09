import type { z } from "zod";

/** Shared shape for `useActionState` server actions across the app. */
export interface ActionResult {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  message?: string;
}

/** First message per field from a ZodError, for inline form errors. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}
