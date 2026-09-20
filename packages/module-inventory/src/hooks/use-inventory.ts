"use client";

import { useCallback } from "react";
import type { InventoryCategory, InventoryItem } from "@apexg/core";
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

export interface UseInventoryCategoriesResult extends Collection<InventoryCategory> {
  /** The admin may add a category or retire one, same as Egresos (RF-27). */
  readonly save: (category: InventoryCategory) => Promise<void>;
  /** Creates one from just its name; the id comes back from the backend. */
  readonly create: (name: string) => Promise<void>;
}

export function useInventoryCategories(): UseInventoryCategoriesResult {
  const { inventory } = useRepositories();

  const load = useCallback(() => inventory.listCategories(), [inventory]);
  const collection = useCollection<InventoryCategory>(load);
  const { apply } = collection;

  const save = useCallback(
    async (category: InventoryCategory) => {
      const saved = await inventory.saveCategory(category);
      apply((current) => upsertById(current, saved));
    },
    [inventory, apply],
  );

  /** An empty id is how the data layer is told the category is new. */
  const create = useCallback(
    (name: string) => save({ id: "", name, active: true }),
    [save],
  );

  return { ...collection, save, create };
}
