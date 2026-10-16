"use client";

import { useCallback } from "react";
import type { Client, Commission, Trainer } from "@apexg/core";
import {
  useCollection,
  useCommissionSettlement,
  upsertById,
  useRepositories,
} from "@apexg/module-kit";
import type { Collection, CommissionSettlement } from "@apexg/module-kit";

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

export interface UseCommissionsResult
  extends Collection<Commission>,
    CommissionSettlement {}

/** Commissions earned from personal-training payments (RF-23, §4.4). */
export function useCommissions(): UseCommissionsResult {
  const { trainers } = useRepositories();
  const load = useCallback(() => trainers.listCommissions(), [trainers]);
  const collection = useCollection<Commission>(load);
  const settlement = useCommissionSettlement(
    collection.items,
    collection.reload,
  );
  return { ...collection, ...settlement };
}

/** Clients, needed to count each trainer's current load (RF-25). */
export function useAssignedClients(): Collection<Client> {
  const { clients } = useRepositories();
  const load = useCallback(() => clients.list(), [clients]);
  return useCollection<Client>(load);
}
