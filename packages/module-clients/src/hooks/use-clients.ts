"use client";

import { useCallback } from "react";
import type { Client, ClientDraft, ClientId } from "@apexg/core";
import { useCollection, upsertById, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseClientsResult extends Collection<Client> {
  /** Creates when `existing` is omitted, updates otherwise. */
  readonly save: (
    draft: ClientDraft,
    existing?: Client,
    photo?: File,
  ) => Promise<void>;
  /** Dónde abrir la foto de un cliente. La arma la capa de datos. */
  readonly photoUrl: (clientId: ClientId) => string;
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
    async (draft: ClientDraft, existing?: Client, photo?: File) => {
      // `hasPhoto` lo decide el servidor al guardar el archivo: el borrador
      // siempre lo trae en false, y sobrescribir con él borraría la foto que
      // el cliente ya tenía de una edición que ni la tocó.
      const saved = existing
        ? await clients.update(
            { ...existing, ...draft, hasPhoto: existing.hasPhoto },
            photo,
          )
        : await clients.create(draft, photo);

      apply((current) => upsertById(current, saved));
    },
    [clients, apply],
  );

  const photoUrl = useCallback(
    (clientId: ClientId) => clients.photoUrl(clientId),
    [clients],
  );

  return { ...collection, save, photoUrl };
}
