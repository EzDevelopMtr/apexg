"use client";

import { fromPesos, toPesos } from "@apexg/core";
import { Input } from "@apexg/ui";
import type { InventoryFieldsProps } from "./inventory-fields";

/** How much there is and what it costs (RF-29). */
export default function InventoryStockFields({
  draft,
  update,
}: InventoryFieldsProps) {
  return (
    <>
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

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="costPrice"
          label="Precio de compra (COP)"
          type="number"
          min={0}
          step={1000}
          value={toPesos(draft.costPrice)}
          onChange={(event) =>
            update("costPrice", fromPesos(Number(event.target.value)))
          }
        />
        <Input
          id="salePrice"
          label="Precio de venta (COP)"
          type="number"
          min={0}
          step={1000}
          value={toPesos(draft.salePrice)}
          onChange={(event) =>
            update("salePrice", fromPesos(Number(event.target.value)))
          }
        />
      </div>
    </>
  );
}
