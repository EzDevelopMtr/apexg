"use client";

// Fetching on mount is a legitimate effect. This becomes a server component
// fetch once the backend exists, which removes the effect entirely.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useRef, useState } from "react";

export type LoadState = "loading" | "ready" | "error";

export interface Collection<T> {
  readonly items: readonly T[];
  readonly state: LoadState;
  readonly error: string | null;
  readonly reload: () => void;
  /** Applies a locally-known change without a round trip. */
  readonly apply: (update: (current: readonly T[]) => readonly T[]) => void;
}

/**
 * Loads a collection and tracks its request state.
 *
 * Six modules need the same load / error / reload behaviour; without this each
 * would repeat it, and each would get the cancellation subtly wrong.
 *
 * `load` must be stable — wrap it in `useCallback` at the call site.
 */
export function useCollection<T>(
  load: () => Promise<readonly T[]>,
): Collection<T> {
  const [items, setItems] = useState<readonly T[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  // Stamps each request so a slow response cannot overwrite a newer one.
  const latestRequest = useRef(0);

  const run = useCallback(async () => {
    const requestId = ++latestRequest.current;

    try {
      const loaded = await load();
      if (requestId !== latestRequest.current) return;
      setItems(loaded);
      setError(null);
      setState("ready");
    } catch (cause) {
      if (requestId !== latestRequest.current) return;
      setError(cause instanceof Error ? cause.message : "Error desconocido");
      setState("error");
    }
  }, [load]);

  useEffect(() => {
    void run();
  }, [run]);

  const reload = useCallback(() => {
    setState("loading");
    void run();
  }, [run]);

  const apply = useCallback(
    (update: (current: readonly T[]) => readonly T[]) => {
      setItems(update);
    },
    [],
  );

  return { items, state, error, reload, apply };
}

/** Replaces a record by id, or appends it when it is new. */
export function upsertById<T extends { readonly id: unknown }>(
  current: readonly T[],
  saved: T,
): readonly T[] {
  const exists = current.some((item) => item.id === saved.id);
  return exists
    ? current.map((item) => (item.id === saved.id ? saved : item))
    : [...current, saved];
}
