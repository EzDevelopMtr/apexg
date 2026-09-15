"use client";

import { useCallback } from "react";
import type { Client, InventoryItem } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection, LoadState } from "@apexg/module-kit";

export interface UseSaleCatalogsResult {
  readonly items: readonly InventoryItem[];
  readonly clients: readonly Client[];
  readonly state: LoadState;
  /** For `CollectionGate` — reload only retries the product list, same
   *  simplification `useDailyLog` already makes for its own three sources. */
  readonly gate: Collection<InventoryItem>;
}

/** The pickers "Registrar venta" needs: which products, which clients. */
export function useSaleCatalogs(): UseSaleCatalogsResult {
  const { inventory, clients } = useRepositories();

  const loadItems = useCallback(() => inventory.list(), [inventory]);
  const loadClients = useCallback(() => clients.list(), [clients]);

  const itemCollection = useCollection<InventoryItem>(loadItems);
  const clientCollection = useCollection<Client>(loadClients);

  const parts = [itemCollection, clientCollection];
  const state: LoadState = parts.some((part) => part.state === "error")
    ? "error"
    : parts.some((part) => part.state === "loading")
      ? "loading"
      : "ready";

  return {
    items: itemCollection.items,
    clients: clientCollection.items,
    state,
    gate: { ...itemCollection, state },
  };
}
