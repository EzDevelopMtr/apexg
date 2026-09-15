import type { InventoryItem, UnitOfMeasure } from "@apexg/core";
import { UNIT_LABELS } from "@apexg/core";

export type InventoryDraft = Omit<InventoryItem, "id">;

export const UNIT_OPTIONS = (Object.keys(UNIT_LABELS) as UnitOfMeasure[]).map(
  (id) => ({ value: id, label: UNIT_LABELS[id] }),
);

export function initialDraft(item?: InventoryItem): InventoryDraft {
  return {
    name: item?.name ?? "",
    unit: item?.unit ?? "unit",
    stock: item?.stock ?? 0,
    minimumStock: item?.minimumStock ?? 0,
    active: item?.active ?? true,
    categoryId: item?.categoryId,
  };
}

/** Mirrors what the API must also enforce (RNF-07). */
export function validateDraft(draft: InventoryDraft): string | null {
  if (!draft.name.trim()) return "El nombre es obligatorio.";
  if (draft.stock < 0) return "Las existencias no pueden ser negativas.";
  if (draft.minimumStock < 0) return "El mínimo no puede ser negativo.";
  return null;
}
