"use client";

import type { InventoryCategory } from "@apexg/core";
import type { InventoryDraft } from "./inventory-draft";
import InventoryIdentityFields from "./inventory-identity-fields";
import InventoryStockFields from "./inventory-stock-fields";

export interface InventoryFieldsProps {
  draft: InventoryDraft;
  categories: readonly InventoryCategory[];
  update: <K extends keyof InventoryDraft>(
    field: K,
    value: InventoryDraft[K],
  ) => void;
}

/** Every editable field of an item (RF-28, RF-29). Layout only. */
export default function InventoryFields(props: InventoryFieldsProps) {
  return (
    <>
      <InventoryIdentityFields {...props} />
      <InventoryStockFields {...props} />
    </>
  );
}
