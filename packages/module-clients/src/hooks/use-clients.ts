"use client";

// Fetching on mount is a legitimate effect. This becomes a server component
// fetch once the backend exists, which removes the effect entirely.
// oxlint-disable react/set-state-in-effect

import { useCallback, useEffect, useRef, useState } from "react";
import type { Client, ClientDraft } from "@apexg/core";
import { useClientRepository } from "../hooks/use-client-repository";

export type LoadState = "loading" | "ready" | "error";

export interface UseClientsResult {
  readonly clients: readonly Client[];
  readonly state: LoadState;
  readonly error: string | null;
  /** Creates when `existing` is omitted, updates otherwise. */
  readonly save: (draft: ClientDraft, existing?: Client) => Promise<void>;
  readonly reload: () => void;
}

/**
 * Owns loading and persisting clients.
 *
 * Components stay presentational: they receive the list and call `save`, and
 * never learn where the data came from.
 */
export function useClients(): UseClientsResult {
  const repository = useClientRepository();

  const [clients, setClients] = useState<readonly Client[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  // Stamps each request so a slow response cannot overwrite a newer one.
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;

    try {
      const loaded = await repository.list();
      if (requestId !== latestRequest.current) return;
      setClients(loaded);
      setError(null);
      setState("ready");
    } catch (cause) {
      if (requestId !== latestRequest.current) return;
      setError(messageOf(cause));
      setState("error");
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => {
    setState("loading");
    void load();
  }, [load]);

  const save = useCallback(
    async (draft: ClientDraft, existing?: Client) => {
      const saved = existing
        ? await repository.update({ ...existing, ...draft })
        : await repository.create(draft);

      setClients((current) => {
        const index = current.findIndex((item) => item.id === saved.id);
        if (index === -1) return [...current, saved];
        return current.map((item) => (item.id === saved.id ? saved : item));
      });
    },
    [repository],
  );

  return { clients, state, error, save, reload };
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Error desconocido";
}
