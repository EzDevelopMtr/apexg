"use client";

import { Input } from "@apexg/ui";
import type { InventoryFieldsProps } from "./inventory-fields";

/** How much there is (RF-29). */
export default function InventoryStockFields({
  draft,
  update,
}: InventoryFieldsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Input
        id="stock"
        label="Existencias"
        type="number"
        min={0}
        value={draft.stock}
        onChange={(event) => update("stock", Number(event.target.value))}
      />
      <Input
        id="minimumStock"
        label="Stock mínimo"
        type="number"
        min={0}
        value={draft.minimumStock}
        onChange={(event) =>
          update("minimumStock", Number(event.target.value))
        }
      />
    </div>
  );
}
