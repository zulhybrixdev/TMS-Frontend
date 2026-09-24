import { useCallback, useState } from "react";

// A form's in-progress values, kept in module memory so they survive the
// re-mount that happens when the language is switched (see i18n/index.tsx) -
// switching language half-way through registration must not wipe what was typed.
// Cleared explicitly on success; not persisted across a page reload.
const drafts = new Map<string, unknown>();

export function useDraft<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => (drafts.has(key) ? (drafts.get(key) as T) : initial));
  const set = useCallback(
    (next: T) => {
      drafts.set(key, next);
      setValue(next);
    },
    [key]
  );
  return [value, set];
}

export function clearDrafts(prefix: string) {
  for (const k of [...drafts.keys()]) if (k.startsWith(prefix)) drafts.delete(k);
}
