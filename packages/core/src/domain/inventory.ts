import type { IsoDate } from "./calendar";
import type { Money } from "./money";
import { subtract } from "./money";

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

export type ItemCategory =
  "supplements" | "accessories" | "clothing" | "care" | "other";

/** User-facing category names, in Spanish. */
export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  supplements: "Suplementos",
  accessories: "Accesorios",
  clothing: "Ropa",
  care: "Cuidado personal",
  other: "Otros",
};

/** Something the gym stocks (RF-28, RF-29). */
export interface InventoryItem {
  readonly id: InventoryItemId;
  readonly name: string;
  readonly sku: string;
  readonly category: ItemCategory;
  readonly unit: UnitOfMeasure;
  readonly costPrice: Money;
  readonly salePrice: Money;
  readonly stock: number;
  readonly minimumStock: number;
  readonly supplier: string;
  readonly active: boolean;
  readonly addedOn: IsoDate;
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

/** Margin per unit sold. Negative when an item is priced below cost. */
export function unitMargin(item: InventoryItem): Money {
  return subtract(item.salePrice, item.costPrice);
}

/** What the stock on hand cost the business. */
export function stockValue(items: readonly InventoryItem[]): Money {
  return items.reduce<Money>(
    (running, item) => (running + item.costPrice * item.stock) as Money,
    0 as Money,
  );
}
