"use client";

import { useCallback } from "react";
import type { Client, ClientDraft } from "@apexg/core";
import { useCollection, upsertById, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseClientsResult extends Collection<Client> {
  /** Creates when `existing` is omitted, updates otherwise. */
  readonly save: (draft: ClientDraft, existing?: Client) => Promise<void>;
}

/**
 * Owns loading and persisting clients.
 *
 * Components stay presentational: they receive the list and call `save`, and
 * never learn where the data came from.
 */
export function useClients(): UseClientsResult {
  const { clients } = useRepositories();

  const load = useCallback(() => clients.list(), [clients]);
  const collection = useCollection<Client>(load);
  const { apply } = collection;

  const save = useCallback(
    async (draft: ClientDraft, existing?: Client) => {
      const saved = existing
        ? await clients.update({ ...existing, ...draft })
        : await clients.create(draft);

      apply((current) => upsertById(current, saved));
    },
    [clients, apply],
  );

  return { ...collection, save };
}
