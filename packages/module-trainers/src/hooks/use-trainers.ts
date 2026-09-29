"use client";

import { useCallback } from "react";
import type { Client, Commission, Trainer, TrainerId } from "@apexg/core";
import { unsettledCommissions } from "@apexg/core";
import { useCollection, upsertById, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseTrainersResult extends Collection<Trainer> {
  readonly save: (
    draft: Omit<Trainer, "id">,
    existing?: Trainer,
  ) => Promise<void>;
}

export function useTrainers(): UseTrainersResult {
  const { trainers } = useRepositories();

  const load = useCallback(() => trainers.list(), [trainers]);
  const collection = useCollection<Trainer>(load);
  const { apply } = collection;

  const save = useCallback(
    async (draft: Omit<Trainer, "id">, existing?: Trainer) => {
      const saved = existing
        ? await trainers.update({ ...existing, ...draft })
        : await trainers.create(draft);
      apply((current) => upsertById(current, saved));
    },
    [trainers, apply],
  );

  return { ...collection, save };
}

export interface UseCommissionsResult extends Collection<Commission> {
  /**
   * Marca como pagadas TODAS las comisiones pendientes del entrenador.
   *
   * Por entrenador y no una por una: en el gimnasio al entrenador se le paga
   * lo acumulado de una vez, y liquidar fila por fila era obligar a la
   * recepcionista a hacer diez clics para un solo pago.
   */
  readonly settleAll: (trainerId: TrainerId) => Promise<void>;
}

/** Commissions earned from personal-training payments (RF-23, §4.4). */
export function useCommissions(): UseCommissionsResult {
  const { trainers } = useRepositories();
  const load = useCallback(() => trainers.listCommissions(), [trainers]);
  const collection = useCollection<Commission>(load);
  const { items, reload } = collection;

  const settleAll = useCallback(
    async (trainerId: TrainerId) => {
      // En serie y no en paralelo: si una falla a mitad, las anteriores ya
      // quedaron liquidadas y la recarga muestra el estado real, en vez de
      // un lote a medias imposible de reconstruir.
      const pending = unsettledCommissions(items, trainerId);
      try {
        for (const commission of pending) {
          await trainers.settleCommission(trainerId, commission.id);
        }
      } finally {
        reload();
      }
    },
    [trainers, items, reload],
  );

  return { ...collection, settleAll };
}

/** Clients, needed to count each trainer's current load (RF-25). */
export function useAssignedClients(): Collection<Client> {
  const { clients } = useRepositories();
  const load = useCallback(() => clients.list(), [clients]);
  return useCollection<Client>(load);
}
