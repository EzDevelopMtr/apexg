"use client";

import { useCallback, useState } from "react";
import type { Money, PocketProgress, SavingsPocketId } from "@apexg/core";
import {
  CONTRIBUTION_REFUSAL_LABELS,
  contributionRefusal,
  progressFromSaved,
} from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";
import type { PocketWithSaved } from "@apexg/data";

export interface UseSavingsResult extends Collection<PocketWithSaved> {
  /** Cada bolsillo con su avance, listo para pintar. */
  readonly progress: readonly PocketProgress[];
  readonly error: string | null;
  readonly create: (name: string, goal: Money) => Promise<void>;
  /** `false` si el dominio lo rechazó; el motivo queda en `refusal`. */
  readonly contribute: (
    pocketId: SavingsPocketId,
    amount: Money,
    notes: string,
  ) => Promise<boolean>;
  readonly close: (pocketId: SavingsPocketId, closed: boolean) => Promise<void>;
  /** El último rechazo del dominio, o null. */
  readonly refusal: string | null;
  readonly clearRefusal: () => void;
}

/**
 * Los bolsillos y lo que se puede hacer con ellos.
 *
 * El avance no se recalcula sumando aportes en el navegador: el total lo trae
 * la capa de datos ya sumado por la base. Lo que sí vive aquí es el reparto
 * entre lo ahorrado y la meta, que es dominio (`pocketProgress`).
 */
export function useSavings(): UseSavingsResult {
  const { savings } = useRepositories();
  const [refusal, setRefusal] = useState<string | null>(null);

  const load = useCallback(() => savings.listPockets(), [savings]);
  const collection = useCollection<PocketWithSaved>(load);
  const { reload } = collection;

  const progress: readonly PocketProgress[] = collection.items.map(
    ({ pocket, saved }) => progressFromSaved(pocket, saved),
  );

  const create = useCallback(
    async (name: string, goal: Money) => {
      await savings.createPocket(name, goal);
      reload();
    },
    [savings, reload],
  );

  const contribute = useCallback(
    async (pocketId: SavingsPocketId, amount: Money, notes: string) => {
      const pocket = collection.items.find(
        (item) => item.pocket.id === pocketId,
      )?.pocket;
      // Espejo de la API, que rechaza lo mismo: así el aviso sale al
      // instante en vez de después de un viaje de ida y vuelta.
      const reason = contributionRefusal(pocket, amount);
      if (reason) {
        setRefusal(CONTRIBUTION_REFUSAL_LABELS[reason]);
        return false;
      }

      setRefusal(null);
      await savings.contribute(pocketId, amount, notes);
      reload();
      return true;
    },
    [savings, reload, collection.items],
  );

  const close = useCallback(
    async (pocketId: SavingsPocketId, closed: boolean) => {
      await savings.updatePocket(pocketId, { closed });
      reload();
    },
    [savings, reload],
  );

  return {
    ...collection,
    progress,
    create,
    contribute,
    close,
    refusal,
    clearRefusal: useCallback(() => setRefusal(null), []),
  };
}
