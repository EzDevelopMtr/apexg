"use client";

import { useMemo } from "react";
import type { InventoryItem, InventorySection, IsoDate } from "@apexg/core";
import { matchesInventoryQuery } from "@apexg/core";

/**
 * The items a list section should show.
 *
 * The section supplies its own predicate, so adding a section never touches
 * this hook — mirrors `useVisibleClients`.
 */
export function useVisibleInventory(
  items: readonly InventoryItem[],
  section: InventorySection,
  query: string,
  referenceDate: IsoDate,
): readonly InventoryItem[] {
  return useMemo(() => {
    if (section.view.kind !== "list") return [];

    const { includes } = section.view;
    return items.filter(
      (item) =>
        includes(item, referenceDate) && matchesInventoryQuery(item, query),
    );
  }, [items, section, query, referenceDate]);
}
