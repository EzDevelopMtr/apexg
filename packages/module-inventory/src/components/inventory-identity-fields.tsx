"use client";

import type { UnitOfMeasure } from "@apexg/core";
import { Input, Select } from "@apexg/ui";
import { UNIT_OPTIONS } from "./inventory-draft";
import type { InventoryFieldsProps } from "./inventory-fields";

/** What the item is: name and unit of measure (RF-28). */
export default function InventoryIdentityFields({
  draft,
  update,
}: InventoryFieldsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Input
        id="name"
        label="Nombre"
        value={draft.name}
        onChange={(event) => update("name", event.target.value)}
        placeholder="Ej. Proteína whey 2 lb"
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
  );
}
