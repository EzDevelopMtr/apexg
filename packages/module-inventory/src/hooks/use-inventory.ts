"use client";

import { useCallback } from "react";
import type { InventoryItem } from "@apexg/core";
import { useCollection, upsertById, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export interface UseInventoryResult extends Collection<InventoryItem> {
  readonly save: (
    draft: Omit<InventoryItem, "id">,
    existing?: InventoryItem,
  ) => Promise<void>;
}

export function useInventory(): UseInventoryResult {
  const { inventory } = useRepositories();

  const load = useCallback(() => inventory.list(), [inventory]);
  const collection = useCollection<InventoryItem>(load);
  const { apply } = collection;

  const save = useCallback(
    async (draft: Omit<InventoryItem, "id">, existing?: InventoryItem) => {
      const saved = existing
        ? await inventory.update({ ...existing, ...draft })
        : await inventory.create(draft);
      apply((current) => upsertById(current, saved));
    },
    [inventory, apply],
  );

  return { ...collection, save };
}
