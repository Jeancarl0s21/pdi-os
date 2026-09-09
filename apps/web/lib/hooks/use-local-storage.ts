"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Per-viewer preference persistence. Renders `initial` on the server and on the
 * first client paint, then hydrates from localStorage on mount — every access is
 * guarded because it can throw (private windows, disabled site data).
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // keep `initial`
    }
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // preference just won't persist this session
      }
    },
    [key],
  );

  return [value, set];
}
