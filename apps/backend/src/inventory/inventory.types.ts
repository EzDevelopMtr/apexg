/**
 * Tipos del módulo Inventario (RF-28 a RF-30).
 *
 * El ERS deja el alcance detallado de este módulo pendiente de una
 * siguiente iteración con el cliente (§2.4: "qué ítems se controlarán").
 * El esquema real refleja solo lo que RF-28/RF-29 piden — nombre, unidad
 * de medida, existencias y mínimo —, más una categoría opcional (migración
 * 005, decisión del usuario 2026-09-15 para poder diferenciar ítems, no un
 * requisito del ERS). Sigue sin columnas para SKU, precio de costo/venta ni
 * proveedor: campos que sí existen en el modelo de dominio ya construido en
 * el frontend (`packages/core/src/domain/inventory.ts`). Ese desfase es del
 * alcance del ERS, no un olvido aquí — se deja para `database-architect`
 * decidir si esas columnas se agregan cuando el cliente afine el alcance.
 */

export type InventoryItemState = 1 | 2;

export interface InventoryItemResult {
  id: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  currentStock: string;
  minimumStock: string;
  state: InventoryItemState;
  categoryId: string | null;
  categoryName: string | null;
}

export interface ListInventoryItemsFilter {
  state?: InventoryItemState;
  /** RF-30 [PROPUESTA]: solo ítems con existencias en o por debajo del mínimo. */
  belowMinimum?: boolean;
  categoryId?: string;
}

export type InventoryCategoryState = 1 | 2;

export interface InventoryCategoryResult {
  id: string;
  name: string;
  description: string | null;
  state: InventoryCategoryState;
}

export type InventoryMovementType = 'in' | 'out' | 'adjustment';

export interface InventoryMovementResult {
  id: string;
  inventoryItemId: string;
  movementType: InventoryMovementType;
  quantity: string;
  previousStock: string | null;
  resultingStock: string | null;
  reason: string | null;
  createdAt: string | null;
}
