import type {
  InventoryItem,
  IsoDate,
  ItemCategory,
  UnitOfMeasure,
} from "@apexg/core";
import {
  ITEM_CATEGORY_LABELS,
  UNIT_LABELS,
  fromPesos,
  today,
} from "@apexg/core";

export type InventoryDraft = Omit<InventoryItem, "id">;

export const CATEGORY_OPTIONS = (
  Object.keys(ITEM_CATEGORY_LABELS) as ItemCategory[]
).map((id) => ({ value: id, label: ITEM_CATEGORY_LABELS[id] }));

export const UNIT_OPTIONS = (Object.keys(UNIT_LABELS) as UnitOfMeasure[]).map(
  (id) => ({ value: id, label: UNIT_LABELS[id] }),
);

export function initialDraft(item?: InventoryItem): InventoryDraft {
  return {
    name: item?.name ?? "",
    sku: item?.sku ?? "",
    category: item?.category ?? "supplements",
    unit: item?.unit ?? "unit",
    costPrice: item?.costPrice ?? fromPesos(0),
    salePrice: item?.salePrice ?? fromPesos(0),
    stock: item?.stock ?? 0,
    minimumStock: item?.minimumStock ?? 0,
    supplier: item?.supplier ?? "",
    active: item?.active ?? true,
    addedOn: item?.addedOn ?? (today() as IsoDate),
  };
}

/** Mirrors what the API must also enforce (RNF-07). */
export function validateDraft(draft: InventoryDraft): string | null {
  if (!draft.name.trim()) return "El nombre es obligatorio.";
  if (!draft.sku.trim()) return "El SKU es obligatorio.";
  if (draft.stock < 0) return "Las existencias no pueden ser negativas.";
  if (draft.minimumStock < 0) return "El mínimo no puede ser negativo.";
  if (draft.salePrice < draft.costPrice) {
    return "El precio de venta no debería ser menor que el de compra.";
  }
  return null;
}
