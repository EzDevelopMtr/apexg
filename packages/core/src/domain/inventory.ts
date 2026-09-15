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
 * A group items can be sorted into, so a long list stays easy to scan.
 *
 * Not an ERS requirement — the catalogue's scope is still open (§2.4) — but
 * a simple, admin-managed grouping decided directly with the user.
 */
export interface InventoryCategory {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

export function activeInventoryCategories(
  categories: readonly InventoryCategory[],
): readonly InventoryCategory[] {
  return categories.filter((category) => category.active);
}

export function findInventoryCategory(
  categories: readonly InventoryCategory[],
  id: string | undefined,
): InventoryCategory | undefined {
  return id === undefined
    ? undefined
    : categories.find((category) => category.id === id);
}

/**
 * Something the gym stocks (RF-28, RF-29).
 *
 * Matches `inventory_items` as it exists today: no SKU, cost/sale price or
 * supplier — the ERS itself leaves that fuller scope pending a decision
 * with the client (§2.4). Adding those back is a schema change, not a
 * frontend one. `categoryId` is the one exception: optional, since it
 * groups items rather than describing them, so an uncategorised item is
 * still a complete, valid record.
 */
export interface InventoryItem {
  readonly id: InventoryItemId;
  readonly name: string;
  readonly unit: UnitOfMeasure;
  readonly stock: number;
  readonly minimumStock: number;
  readonly active: boolean;
  readonly categoryId?: string;
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

/** Whether the item matches a free-text search over its name. */
export function matchesInventoryQuery(
  item: InventoryItem,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return item.name.toLowerCase().includes(needle);
}
