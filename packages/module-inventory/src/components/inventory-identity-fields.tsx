"use client";

import type { ItemCategory, UnitOfMeasure } from "@apexg/core";
import { Input, Select } from "@apexg/ui";
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from "./inventory-draft";
import type { InventoryFieldsProps } from "./inventory-fields";

/** What the item is: name, SKU, category, unit and supplier (RF-28). */
export default function InventoryIdentityFields({
  draft,
  update,
}: InventoryFieldsProps) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="name"
          label="Nombre"
          value={draft.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Ej. Proteína whey 2 lb"
        />
        <Input
          id="sku"
          label="SKU"
          value={draft.sku}
          onChange={(event) => update("sku", event.target.value)}
          placeholder="SUP-001"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Select
          id="category"
          label="Categoría"
          value={draft.category}
          options={CATEGORY_OPTIONS}
          onChange={(event) =>
            update("category", event.target.value as ItemCategory)
          }
        />
        <Select
          id="unit"
          label="Unidad de medida"
          value={draft.unit}
          options={UNIT_OPTIONS}
          onChange={(event) =>
            update("unit", event.target.value as UnitOfMeasure)
          }
        />
      </div>

      <Input
        id="supplier"
        label="Proveedor"
        value={draft.supplier}
        onChange={(event) => update("supplier", event.target.value)}
      />
    </>
  );
}
