import type {
  InventoryCategory,
  InventoryItem,
  InventoryItemId,
  UnitOfMeasure,
} from "@apexg/core";
import { toInventoryItemId } from "@apexg/core";
import type { InventoryRepository } from "../repositories";
import { RecordNotFoundError } from "../repositories";
import { ApiError, apiFetch } from "./http-client";

type ApiItemState = 1 | 2;

interface ApiInventoryItemResult {
  id: string;
  name: string;
  unitOfMeasure: string;
  currentStock: string;
  minimumStock: string;
  state: ApiItemState;
  categoryId: string | null;
}

interface ApiInventoryCategoryResult {
  id: string;
  name: string;
  state: ApiItemState;
}

const KNOWN_UNITS = new Set<string>([
  "unit",
  "box",
  "kilogram",
  "litre",
  "pack",
]);

/** `unit_of_measure` is free text on the backend (no CHECK) — anything outside our 5 options falls back safely. */
function toUnit(raw: string): UnitOfMeasure {
  return KNOWN_UNITS.has(raw) ? (raw as UnitOfMeasure) : "unit";
}

/** Up to 3 decimals, matching `inventory_items`/`inventory_movements` (`NUMERIC(12,3)`) — avoids float artifacts like "1.2000000000000002". */
function toQuantityString(value: number): string {
  return (Math.round(value * 1000) / 1000).toString();
}

function fromResult(row: ApiInventoryItemResult): InventoryItem {
  return {
    id: toInventoryItemId(row.id),
    name: row.name,
    unit: toUnit(row.unitOfMeasure),
    stock: Number(row.currentStock),
    minimumStock: Number(row.minimumStock),
    active: row.state === 1,
    categoryId: row.categoryId ?? undefined,
  };
}

function fromCategoryResult(
  row: ApiInventoryCategoryResult,
): InventoryCategory {
  return {
    id: row.id,
    name: row.name,
    active: row.state === 1,
  };
}

export class HttpInventoryRepository implements InventoryRepository {
  async list(): Promise<readonly InventoryItem[]> {
    const rows = await apiFetch<ApiInventoryItemResult[]>("/inventory-items");
    return rows.map(fromResult);
  }

  async findById(id: InventoryItemId): Promise<InventoryItem | undefined> {
    try {
      const row = await apiFetch<ApiInventoryItemResult>(
        `/inventory-items/${id}`,
      );
      return fromResult(row);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async create(draft: Omit<InventoryItem, "id">): Promise<InventoryItem> {
    const row = await apiFetch<ApiInventoryItemResult>("/inventory-items", {
      method: "POST",
      body: {
        name: draft.name,
        unitOfMeasure: draft.unit,
        initialStock: toQuantityString(draft.stock),
        minimumStock: toQuantityString(draft.minimumStock),
        categoryId: draft.categoryId,
      },
    });
    return fromResult(row);
  }

  /**
   * `currentStock` is not part of `PATCH /inventory-items/:id` on purpose —
   * it only ever changes through `POST .../movements`, so every change has
   * a trace. The edit form still has one plain "Existencias" field, so a
   * changed value here becomes an `adjustment` movement (the signed-delta
   * type meant for manual corrections) before the rest of the patch.
   */
  async update(item: InventoryItem): Promise<InventoryItem> {
    const current = await this.findById(item.id);
    if (!current) {
      throw new RecordNotFoundError("inventory item", item.id);
    }

    if (item.stock !== current.stock) {
      await apiFetch(`/inventory-items/${item.id}/movements`, {
        method: "POST",
        body: {
          movementType: "adjustment",
          quantity: toQuantityString(item.stock - current.stock),
          reason: "Ajuste manual desde el formulario de edición",
        },
      });
    }

    const row = await apiFetch<ApiInventoryItemResult>(
      `/inventory-items/${item.id}`,
      {
        method: "PATCH",
        body: {
          name: item.name,
          unitOfMeasure: item.unit,
          minimumStock: toQuantityString(item.minimumStock),
          state: item.active ? 1 : 2,
          // Explicit `null` (not omitted) so clearing the category in the
          // form actually clears it — an absent field means "leave as is".
          categoryId: item.categoryId ?? null,
        },
      },
    );
    return fromResult(row);
  }

  async listCategories(): Promise<readonly InventoryCategory[]> {
    const rows = await apiFetch<ApiInventoryCategoryResult[]>(
      "/inventory-categories",
    );
    return rows.map(fromCategoryResult);
  }

  /**
   * An empty id means the category is new. The caller no longer invents one
   * from the name to signal that — deciding it, and minting the real id, is
   * this layer's job.
   */
  async saveCategory(category: InventoryCategory): Promise<InventoryCategory> {
    const row =
      category.id !== ""
        ? await apiFetch<ApiInventoryCategoryResult>(
            `/inventory-categories/${category.id}`,
            {
              method: "PATCH",
              body: { name: category.name, state: category.active ? 1 : 2 },
            },
          )
        : await apiFetch<ApiInventoryCategoryResult>("/inventory-categories", {
            method: "POST",
            body: { name: category.name },
          });
    return fromCategoryResult(row);
  }
}
