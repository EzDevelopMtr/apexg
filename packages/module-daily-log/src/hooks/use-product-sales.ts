"use client";

import { useCallback } from "react";
import type { ProductSale } from "@apexg/core";
import { today } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import type { Collection } from "@apexg/module-kit";

export type SaleDraft = Omit<
  ProductSale,
  "id" | "itemName" | "clientName" | "soldOn" | "recordedBy"
>;

export interface UseProductSalesResult extends Collection<ProductSale> {
  /** Discounts the item's stock on the backend (RF-28/29), same transaction. */
  readonly create: (draft: SaleDraft) => Promise<void>;
}

export function useProductSales(): UseProductSalesResult {
  const { productSales } = useRepositories();

  const load = useCallback(() => productSales.list(), [productSales]);
  const collection = useCollection<ProductSale>(load);
  const { apply } = collection;

  const create = useCallback(
    async (draft: SaleDraft) => {
      const saved = await productSales.create({ ...draft, soldOn: today() });
      apply((current) => [...current, saved]);
    },
    [productSales, apply],
  );

  return { ...collection, create };
}
