declare const inventoryItemIdBrand: unique symbol;
export type InventoryItemId = string & {
  readonly [inventoryItemIdBrand]: true;
};

export function toInventoryItemId(value: string): InventoryItemId {
  return value as InventoryItemId;
}

export type UnitOfMeasure = "unit" | "box" | "kilogram" | "litre" | "pack";

/** User-facing unit names, in Spanish. */
export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  unit: "Unidad",
  box: "Caja",
  kilogram: "Kilogramo",
  litre: "Litro",
  pack: "Paquete",
};

/**
 * Something the gym stocks (RF-28, RF-29).
 *
 * Matches `inventory_items` as it exists today: no SKU, category, cost/sale
 * price or supplier — the ERS itself leaves that fuller scope pending a
 * decision with the client (§2.4). Adding those back is a schema change,
 * not a frontend one.
 */
export interface InventoryItem {
  readonly id: InventoryItemId;
  readonly name: string;
  readonly unit: UnitOfMeasure;
  readonly stock: number;
  readonly minimumStock: number;
  readonly active: boolean;
}

/** Whether stock has fallen to or below the configured minimum (RF-30). */
export function isBelowMinimum(item: InventoryItem): boolean {
  return item.stock <= item.minimumStock;
}

/** Items that need restocking (RF-30). */
export function itemsBelowMinimum(
  items: readonly InventoryItem[],
): readonly InventoryItem[] {
  return items.filter((item) => item.active && isBelowMinimum(item));
}
